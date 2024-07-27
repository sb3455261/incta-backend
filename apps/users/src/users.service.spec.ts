import { Test, TestingModule } from '@nestjs/testing';
import { BadGatewayException } from '@nestjs/common';
import { appConfig, User } from '@app/shared';
import { UsersService } from './users.service';
import { UserRepository } from './repositories/user-repository/user-abstract.repository';

type MockType<T> = {
  [P in keyof T]: jest.Mock;
};

const createMockRepository = (): MockType<UserRepository> => ({
  findAll: jest.fn<Promise<User[]>, []>(),
});

const originalEnv = process.env;
beforeAll(() => {
  process.env = { ...originalEnv, USERS_DATABASE_URL: 'mock-database-url' };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: MockType<UserRepository>;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useFactory: createMockRepository,
        },
        {
          provide: appConfig.KEY,
          useFactory: () => ({
            ...appConfig(),
            USERS_DATABASE_URL: process.env.USERS_DATABASE_URL,
          }),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    mockRepository = module.get(UserRepository);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return hello message with user data', async () => {
    const mockUsers: User[] = [
      { id: '1', email: 'test@example.com', name: 'Test User' },
    ];
    mockRepository.findAll.mockResolvedValue(mockUsers);

    const result = await service.getHello();

    expect(result).toContain('Hello World 1!');
    expect(result).toContain(
      `is running on port ${appConfig().USERS_MICROSERVICE_PORT}`,
    );
    expect(result).toContain(
      'USERS_DATABASE_URL is set to: ...mock-database-url',
    );
    expect(result).toContain(JSON.stringify(mockUsers));
  });

  it('should throw BadGatewayException when database error occurs', async () => {
    const errorMessage = 'Database error';
    mockRepository.findAll.mockRejectedValue(new Error(errorMessage));

    await expect(service.getHello()).rejects.toThrow(BadGatewayException);
    expect(consoleErrorSpy).toHaveBeenCalledWith(errorMessage);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import {
  EDbEntityFields,
  EUserFields,
  EUsersProviderFields,
  EProvider,
} from '@app/shared';
import { UsersService } from './users.service';
import { UserRepository } from './ports/user-abstract.repository';
import { UserFactory } from '../domain/factories/user.factory';
import { CreateUsersProviderCommand } from './commands/create-users-provider.command';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: jest.Mocked<UserRepository>;
  let mockUserFactory: jest.Mocked<UserFactory>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useFactory: () => ({
            findAll: jest.fn(),
            create: jest.fn(),
          }),
        },
        {
          provide: UserFactory,
          useFactory: () => ({
            create: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    mockRepository = module.get(UserRepository) as jest.Mocked<UserRepository>;
    mockUserFactory = module.get(UserFactory) as jest.Mocked<UserFactory>;
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          [EDbEntityFields.id]: '1',
          [EUserFields.providers]: [
            {
              [EDbEntityFields.id]: '1',
              [EUsersProviderFields.userLocalId]: '1',
              [EUsersProviderFields.providerLocalId]: '1',
              [EUsersProviderFields.sub]: null,
              [EUsersProviderFields.email]: 'test@example.com',
              [EUsersProviderFields.login]: 'testuser',
              [EUsersProviderFields.name]: 'Test',
              [EUsersProviderFields.surname]: 'User',
              [EUsersProviderFields.password]: 'hashedpassword',
              [EUsersProviderFields.avatar]: 'https://example.com/avatar.jpg',
              [EUsersProviderFields.emailIsValidated]: false,
              [EDbEntityFields.createdAt]: new Date(),
              [EDbEntityFields.updatedAt]: new Date(),
            },
          ],
          [EDbEntityFields.createdAt]: new Date(),
          [EDbEntityFields.updatedAt]: new Date(),
        },
      ];

      mockRepository.findAll.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });

    it('should throw Error when repository throws an error', async () => {
      const errorMessage = 'Database error';
      mockRepository.findAll.mockRejectedValue(new Error(errorMessage));

      await expect(service.findAll()).rejects.toThrow(errorMessage);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUsersProviderCommand = new CreateUsersProviderCommand(
        EProvider.local,
        null,
        'test@example.com',
        'testuser',
        'Test',
        'User',
        'password123',
        'https://example.com/avatar.jpg',
        false,
      );

      const mockUser = {
        [EDbEntityFields.id]: '1',
        [EUserFields.providers]: [createUsersProviderCommand],
      };

      const mockCreatedUser = {
        [EDbEntityFields.id]: '1',
      };

      mockUserFactory.create.mockReturnValue(mockUser);
      mockRepository.create.mockResolvedValue(mockCreatedUser);

      const result = await service.create(createUsersProviderCommand);

      expect(result).toEqual(mockCreatedUser);
      expect(mockUserFactory.create).toHaveBeenCalledWith(
        createUsersProviderCommand,
      );
      expect(mockRepository.create).toHaveBeenCalledWith(mockUser);
    });

    it('should throw Error when repository throws an error', async () => {
      const createUsersProviderCommand = new CreateUsersProviderCommand(
        EProvider.local,
        null,
        'test@example.com',
        'testuser',
        'Test',
        'User',
        'password123',
        'https://example.com/avatar.jpg',
        false,
      );

      const errorMessage = 'Database error';
      mockUserFactory.create.mockReturnValue({} as any);
      mockRepository.create.mockRejectedValue(new Error(errorMessage));

      await expect(service.create(createUsersProviderCommand)).rejects.toThrow(
        errorMessage,
      );
    });
  });
});

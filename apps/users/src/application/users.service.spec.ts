import { Test, TestingModule } from '@nestjs/testing';
import {
  EDbEntityFields,
  EUserFields,
  EUsersProviderFields,
  EProvider,
  IUser,
} from '@app/shared';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UsersService } from './users.service';
import { UserRepository } from './ports/user-abstract.repository';
import { UserFactory } from '../domain/factories/user.factory';
import { CreateUsersProviderCommand } from './commands/create-users-provider.command';
import { User } from '../domain/user';
import { FindUsersProviderQuery } from './queries/find-users-provider.query';
import { FindProviderQuery } from './queries/find-provider.query';
import { CreateUserCommand } from './commands/create-user.command';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: jest.Mocked<UserRepository>;
  let mockUserFactory: jest.Mocked<UserFactory>;
  let mockCommandBus: jest.Mocked<CommandBus>;
  let mockQueryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useFactory: () => ({
            findAll: jest.fn(),
            create: jest.fn(),
            findUsersProvider: jest.fn(),
            findProvider: jest.fn(),
            update: jest.fn(),
            createProvider: jest.fn(),
          }),
        },
        {
          provide: UserFactory,
          useFactory: () => ({
            create: jest.fn(),
          }),
        },
        {
          provide: CommandBus,
          useFactory: () => ({
            execute: jest.fn(),
          }),
        },
        {
          provide: QueryBus,
          useFactory: () => ({
            execute: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    mockRepository = module.get(UserRepository) as jest.Mocked<UserRepository>;
    mockUserFactory = module.get(UserFactory) as jest.Mocked<UserFactory>;
    mockCommandBus = module.get(CommandBus) as jest.Mocked<CommandBus>;
    mockQueryBus = module.get(QueryBus) as jest.Mocked<QueryBus>;
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers: IUser[] = [
        {
          [EDbEntityFields.id]: '1',
          [EUserFields.providers]: [
            {
              [EDbEntityFields.id]: '1',
              [EUsersProviderFields.userLocalId]: '1',
              [EUsersProviderFields.providerLocalId]: '1',
              [EUsersProviderFields.sub]: 'SUB',
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

      mockQueryBus.execute.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
      expect(mockQueryBus.execute).toHaveBeenCalled();
    });

    it('should throw Error when repository throws an error', async () => {
      const errorMessage = 'Database error';
      mockQueryBus.execute.mockRejectedValue(new Error(errorMessage));

      await expect(service.findAll()).rejects.toThrow(errorMessage);
    });
  });

  describe('create', () => {
    it('should create a new local user when no existing user is found', async () => {
      const createUsersProviderCommand = new CreateUsersProviderCommand(
        EProvider.local,
        'SUB',
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
        getUsersProvider: jest.fn().mockReturnValue(createUsersProviderCommand),
        getProviderName: jest.fn().mockReturnValue(EProvider.local),
        setProviderLocalId: jest.fn(),
        isLocalProvider: jest.fn().mockReturnValue(true),
      } as unknown as User;

      const mockCreatedUser = {
        [EDbEntityFields.id]: '1',
      };

      mockQueryBus.execute.mockImplementation((query) => {
        if (query instanceof FindUsersProviderQuery) {
          return Promise.resolve(null);
        }
        if (query instanceof FindProviderQuery) {
          return Promise.resolve({ id: 'providerId' });
        }
        return undefined;
      });

      mockUserFactory.create.mockReturnValue(mockUser);
      mockCommandBus.execute.mockResolvedValue(mockCreatedUser);

      const result = await service.create(createUsersProviderCommand);

      expect(result).toEqual(mockCreatedUser);
      expect(mockUserFactory.create).toHaveBeenCalledWith(
        createUsersProviderCommand,
        undefined,
      );
      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        expect.any(FindProviderQuery),
      );
      expect(mockUser.setProviderLocalId).toHaveBeenCalledWith('providerId');
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.any(CreateUserCommand),
      );
    });
  });
});

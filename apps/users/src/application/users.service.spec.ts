import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import {
  EDbEntityFields,
  EUsersProviderFields,
  EProvider,
  appConfig,
  TAppConfig,
  ForgotUsersProviderPasswordDto,
  ResetUsersProviderPasswordDto,
  EUsersParams,
} from '@app/shared';
import { of } from 'rxjs';
import { UsersService } from './users.service';
import { UserFactory } from '../domain/factories/user.factory';
import { UsersProviderFactory } from '../domain/factories/users-provider.factory';
import { FindUsersProviderQuery } from './queries/find-users-provider.query';
import { FindProviderQuery } from './queries/find-provider.query';
import { CreateUserCommand } from './commands/create-user.command';
import { User } from '../domain/user';
import { CreateUsersProviderCommand } from './commands/create-users-provider.command';

describe('UsersService', () => {
  let service: UsersService;
  let mockCommandBus: jest.Mocked<CommandBus>;
  let mockQueryBus: jest.Mocked<QueryBus>;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockAuthClient: jest.Mocked<ClientProxy>;
  let mockUserFactory: jest.Mocked<UserFactory>;
  let mockUsersProviderFactory: jest.Mocked<UsersProviderFactory>;
  let mockConfig: TAppConfig;

  beforeEach(async () => {
    mockConfig = {
      ...appConfig(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
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
        {
          provide: JwtService,
          useFactory: () => ({
            sign: jest.fn(),
            verify: jest.fn(),
          }),
        },
        {
          provide: appConfig.KEY,
          useValue: mockConfig,
        },
        {
          provide: mockConfig.AUTH_MICROSERVICE_NAME,
          useFactory: () => ({
            send: jest.fn(),
          }),
        },
        {
          provide: UserFactory,
          useFactory: () => ({
            create: jest.fn(),
          }),
        },
        {
          provide: UsersProviderFactory,
          useFactory: () => ({
            create: jest.fn(),
            hashPassword: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    mockCommandBus = module.get(CommandBus) as jest.Mocked<CommandBus>;
    mockQueryBus = module.get(QueryBus) as jest.Mocked<QueryBus>;
    mockJwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    mockAuthClient = module.get(
      mockConfig.AUTH_MICROSERVICE_NAME,
    ) as jest.Mocked<ClientProxy>;
    mockUserFactory = module.get(UserFactory) as jest.Mocked<UserFactory>;
    mockUsersProviderFactory = module.get(
      UsersProviderFactory,
    ) as jest.Mocked<UsersProviderFactory>;
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

      mockUserFactory.create.mockResolvedValue(mockUser);
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

  describe('findUsersProviderByEmailOrLogin', () => {
    it('should return user provider when found', async () => {
      const mockUser = {
        [EDbEntityFields.id]: '1',
        [EUsersProviderFields.userLocalId]: '1',
        [EUsersProviderFields.password]: 'hashedPassword',
        [EUsersProviderFields.email]: 'test@example.com',
        [EUsersProviderFields.emailIsValidated]: true,
      };

      mockCommandBus.execute.mockResolvedValue(mockUser);

      const result =
        await service.findUsersProviderByEmailOrLogin('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should return undefined when user provider is not found', async () => {
      mockCommandBus.execute.mockResolvedValue(undefined);

      const result = await service.findUsersProviderByEmailOrLogin(
        'nonexistent@example.com',
      );

      expect(result).toBeUndefined();
    });
  });

  describe('verifyEmailVerificationToken', () => {
    it('should return true for valid token', async () => {
      const mockDecodedToken = { [EDbEntityFields.id]: 'userId' };
      mockJwtService.verify.mockReturnValue(mockDecodedToken);
      mockQueryBus.execute.mockResolvedValue({ id: 'userId' });
      mockCommandBus.execute.mockResolvedValue(undefined);

      const result = await service.verifyEmailVerificationToken('valid-token');

      expect(result).toBe(true);
    });

    it('should return false for invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result =
        await service.verifyEmailVerificationToken('invalid-token');

      expect(result).toBe(false);
    });
  });

  describe('forgotPassword', () => {
    it('should send reset password email', async () => {
      const dto: ForgotUsersProviderPasswordDto = {
        [EUsersProviderFields.emailOrLogin]: 'test@example.com',
        [EUsersProviderFields.recaptchaToken]: 'recaptcha-token',
      };

      const mockUser = {
        [EDbEntityFields.id]: 'userId',
        [EUsersProviderFields.email]: 'test@example.com',
      };

      mockCommandBus.execute.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('reset-token');

      await service.forgotPassword(dto);

      expect(mockCommandBus.execute).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset user password', async () => {
      const dto: ResetUsersProviderPasswordDto = {
        [EUsersProviderFields.password]: 'newPassword123!',
        [EUsersProviderFields.repeatPassword]: 'newPassword123!',
        [EUsersParams.token]: 'valid-token',
        [EUsersProviderFields.recaptchaToken]: 'recaptcha-token',
      };

      const mockDecodedToken = { [EDbEntityFields.id]: 'userId' };
      mockJwtService.verify.mockReturnValue(mockDecodedToken);

      const mockUser = {
        [EDbEntityFields.id]: 'userId',
        [EUsersProviderFields.userLocalId]: 'userLocalId',
        [EUsersProviderFields.email]: 'test@example.com',
        [EUsersProviderFields.providerName]: EProvider.local,
      };

      mockQueryBus.execute.mockResolvedValue(mockUser);
      mockUsersProviderFactory.hashPassword.mockResolvedValue('hashedPassword');
      mockCommandBus.execute.mockResolvedValue(undefined);
      mockAuthClient.send.mockReturnValue(of(undefined));

      await service.resetPassword(dto);

      expect(mockJwtService.verify).toHaveBeenCalled();
      expect(mockQueryBus.execute).toHaveBeenCalled();
      expect(mockUsersProviderFactory.hashPassword).toHaveBeenCalled();
      expect(mockCommandBus.execute).toHaveBeenCalled();
      expect(mockAuthClient.send).toHaveBeenCalled();
    });
  });
});

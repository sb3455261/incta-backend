import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import {
  EAuthRoutes,
  EProvider,
  EUsersProviderFields,
  SigninDto,
  UsersProviderDto,
  appConfig,
  TAppConfig,
} from '@app/shared';
import { createMockAppConfig } from '@app/shared/tests/mocks/app-config.mock';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let mockConfig: TAppConfig;

  afterAll(async () => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    mockConfig = createMockAppConfig();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useFactory: () => ({
            localSignup: jest.fn(),
            localSignin: jest.fn(),
            externalSignin: jest.fn(),
            logout: jest.fn(),
            rotateToken: jest.fn(),
            validateToken: jest.fn(),
            deleteAllUsersProviderSessions: jest.fn(),
          }),
        },
        {
          provide: appConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('localSignup', () => {
    it('should call authService.localSignup and return the result', async () => {
      const signupDto: Partial<UsersProviderDto> = {
        [EUsersProviderFields.providerName]: EProvider.local,
        [EUsersProviderFields.email]: 'test@example.com',
        [EUsersProviderFields.login]: 'testuser',
        [EUsersProviderFields.name]: 'Test',
        [EUsersProviderFields.surname]: 'User',
        [EUsersProviderFields.password]: 'Password123!',
        [EUsersProviderFields.repeatPassword]: 'Password123!',
        [EUsersProviderFields.agreement]: 'agreed',
        [EUsersProviderFields.avatar]: 'https://example.com/avatar.jpg',
        [EUsersProviderFields.emailIsValidated]: false,
      };

      const mockResult = { accessToken: 'token' };
      authService.localSignup.mockResolvedValue(mockResult);

      const result = await controller.localSignup(
        signupDto as Required<typeof signupDto>,
      );

      expect(authService.localSignup).toHaveBeenCalledWith(signupDto);
      expect(result).toEqual(mockResult);
    });

    it('should throw RpcException when authService.localSignup throws an error', async () => {
      const signupDto: Partial<UsersProviderDto> = {
        [EUsersProviderFields.providerName]: EProvider.local,
        [EUsersProviderFields.email]: 'test@example.com',
        [EUsersProviderFields.login]: 'testuser',
        [EUsersProviderFields.name]: 'Test',
        [EUsersProviderFields.surname]: 'User',
        [EUsersProviderFields.password]: 'Password123!',
        [EUsersProviderFields.repeatPassword]: 'Password123!',
        [EUsersProviderFields.agreement]: 'agreed',
        [EUsersProviderFields.avatar]: 'https://example.com/avatar.jpg',
        [EUsersProviderFields.emailIsValidated]: false,
      };

      authService.localSignup.mockRejectedValue(new Error('Signup failed'));

      await expect(
        controller.localSignup(signupDto as Required<typeof signupDto>),
      ).rejects.toThrow(RpcException);
    });
  });

  describe('localSignin', () => {
    it('should call authService.localSignin and return the result', async () => {
      const signinDto: SigninDto = {
        [EUsersProviderFields.emailOrLogin]: 'test@example.com',
        [EUsersProviderFields.password]: 'Password123!',
      };

      const mockResult = { accessToken: 'token' };
      authService.localSignin.mockResolvedValue(mockResult);

      const result = await controller.localSignin(signinDto);

      expect(authService.localSignin).toHaveBeenCalledWith(
        signinDto[EUsersProviderFields.emailOrLogin],
        signinDto[EUsersProviderFields.password],
      );
      expect(result).toEqual(mockResult);
    });

    it('should throw RpcException when authService.localSignin throws an error', async () => {
      const signinDto: SigninDto = {
        [EUsersProviderFields.emailOrLogin]: 'test@example.com',
        [EUsersProviderFields.password]: 'Password123!',
      };

      authService.localSignin.mockRejectedValue(new Error('Signin failed'));

      await expect(controller.localSignin(signinDto)).rejects.toThrow(
        RpcException,
      );
    });
  });

  describe('externalSignin', () => {
    it('should throw NotImplementedException', async () => {
      const data = {
        provider: EProvider.google,
        [EUsersProviderFields.agreement]: 'agreed',
      };

      await expect(controller.externalSignin(data)).rejects.toThrow(
        RpcException,
      );
    });
  });

  describe('logout', () => {
    it('should call authService.logout and return success message', async () => {
      const token = 'validToken';

      await controller.logout(token);

      expect(authService.logout).toHaveBeenCalledWith(token);
    });

    it('should throw RpcException when authService.logout throws an error', async () => {
      const token = 'invalidToken';

      authService.logout.mockRejectedValue(new Error('Logout failed'));

      await expect(controller.logout(token)).rejects.toThrow(RpcException);
    });
  });

  describe('refreshToken', () => {
    it('should call authService.rotateToken and return the result', async () => {
      const token = 'validToken';
      const mockResult = { 'access-token': 'newToken' };

      authService.rotateToken.mockResolvedValue(mockResult);

      const result = await controller.refreshToken(token);

      expect(authService.rotateToken).toHaveBeenCalledWith(token);
      expect(result).toEqual(mockResult);
    });

    it('should throw RpcException when authService.rotateToken throws an error', async () => {
      const token = 'invalidToken';

      authService.rotateToken.mockRejectedValue(
        new Error('Token rotation failed'),
      );

      await expect(controller.refreshToken(token)).rejects.toThrow(
        RpcException,
      );
    });
  });

  describe('validateToken', () => {
    it('should call authService.validateToken and return the result', async () => {
      const token = 'validToken';
      const mockResult = { valid: true, userId: '123' };

      authService.validateToken.mockResolvedValue(mockResult);

      const result = await controller.validateToken(token);

      expect(authService.validateToken).toHaveBeenCalledWith(token);
      expect(result).toEqual(mockResult);
    });

    it('should throw RpcException when authService.validateToken throws an error', async () => {
      const token = 'invalidToken';

      authService.validateToken.mockRejectedValue(
        new Error('Token validation failed'),
      );

      await expect(controller.validateToken(token)).rejects.toThrow(
        RpcException,
      );
    });
  });

  describe('deleteAllUsersProviderSessions', () => {
    it('should call authService.deleteAllUsersProviderSessions and return success message', async () => {
      const data = { userId: '123', providerName: EProvider.local };

      await controller.deleteAllUsersProviderSessions(data);

      expect(authService.deleteAllUsersProviderSessions).toHaveBeenCalledWith(
        data.userId,
        data.providerName,
      );
    });

    it('should throw RpcException when authService.deleteAllUsersProviderSessions throws an error', async () => {
      const data = { userId: '123', providerName: EProvider.local };

      authService.deleteAllUsersProviderSessions.mockRejectedValue(
        new Error('Delete sessions failed'),
      );

      await expect(
        controller.deleteAllUsersProviderSessions(data),
      ).rejects.toThrow(RpcException);
    });
  });
});

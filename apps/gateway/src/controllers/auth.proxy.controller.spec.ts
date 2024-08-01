import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import {
  EAuthParams,
  EAuthRoutes,
  EProvider,
  EUsersProviderFields,
  Messages,
  SigninDto,
  UsersProviderDto,
  appConfig,
  TAppConfig,
} from '@app/shared';
import { createMockAppConfig } from '@app/shared/tests/mocks/app-config.mock';
import { AuthProxyController } from './auth.proxy.controller';

describe('AuthProxyController', () => {
  let controller: AuthProxyController;
  let authClient: ClientProxy;
  let mockConfig: TAppConfig;

  beforeEach(async () => {
    mockConfig = createMockAppConfig();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthProxyController],
      providers: [
        {
          provide: mockConfig.AUTH_MICROSERVICE_NAME,
          useValue: {
            send: jest.fn(),
          },
        },
        {
          provide: appConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    controller = module.get<AuthProxyController>(AuthProxyController);
    authClient = module.get<ClientProxy>(mockConfig.AUTH_MICROSERVICE_NAME);
  });

  describe('localSignup', () => {
    it('should call authClient.send with correct parameters and return success response', async () => {
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

      jest
        .spyOn(authClient, 'send')
        .mockReturnValue(of({ [EAuthParams.accessToken]: 'token' }));

      const result = await controller.localSignup(
        signupDto as Required<typeof signupDto>,
      );

      expect(authClient.send).toHaveBeenCalledWith(
        { cmd: `${EAuthRoutes.local}/${EAuthRoutes.signup}` },
        signupDto,
      );
      expect(result).toEqual({
        success: true,
        message: Messages.SUCCESS_REGISTRATION,
      });
    });

    it('should return failure response when signup fails', async () => {
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

      jest.spyOn(authClient, 'send').mockReturnValue(of({}));

      const result = await controller.localSignup(
        signupDto as Required<typeof signupDto>,
      );

      expect(result).toEqual({
        success: false,
        message: Messages.ERROR_REGISRATION_FAILED,
      });
    });
  });

  describe('localSignin', () => {
    it('should call authClient.send with correct parameters and set cookie on success', async () => {
      const signinDto: SigninDto = {
        [EUsersProviderFields.emailOrLogin]: 'test@example.com',
        [EUsersProviderFields.password]: 'Password123!',
      };

      const mockResponse = {
        cookie: jest.fn(),
      };

      jest
        .spyOn(authClient, 'send')
        .mockReturnValue(of({ [EAuthParams.accessToken]: 'token' }));

      const result = await controller.localSignin(
        signinDto,
        mockResponse as any,
      );

      expect(authClient.send).toHaveBeenCalledWith(
        { cmd: `${EAuthRoutes.local}/${EAuthRoutes.signin}` },
        signinDto,
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        EAuthParams.accessToken,
        'token',
        expect.any(Object),
      );
      expect(result).toEqual({
        success: true,
        message: Messages.SUCCESS_LOGIN,
      });
    });
  });

  describe('externalSignin', () => {
    it('should call authClient.send with correct parameters and redirect on success', async () => {
      const provider = EProvider.google;
      const agreement = '1';
      const mockResponse = {
        redirect: jest.fn(),
        cookie: jest.fn(),
      };

      jest
        .spyOn(authClient, 'send')
        .mockReturnValue(of({ [EAuthParams.accessToken]: 'token' }));

      await controller.externalSignin(provider, agreement, mockResponse as any);

      expect(authClient.send).toHaveBeenCalledWith(
        { cmd: `${EAuthRoutes.external}/:${EAuthParams.provider}` },
        { provider, agreement },
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        EAuthParams.accessToken,
        'token',
        expect.any(Object),
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        mockConfig.USERS_LOGIN_PAGE_URL,
      );
    });

    it('should redirect with error status when external signin fails', async () => {
      const provider = EProvider.google;
      const agreement = '1';
      const mockResponse = {
        redirect: jest.fn(),
      };

      jest.spyOn(authClient, 'send').mockReturnValue(of({}));

      await controller.externalSignin(provider, agreement, mockResponse as any);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        400,
        mockConfig.USERS_LOGIN_PAGE_URL,
      );
    });
  });

  describe('logout', () => {
    it('should call authClient.send with correct parameters and clear cookie', async () => {
      const mockRequest = {
        cookies: {
          [EAuthParams.accessToken]: 'token',
        },
      };
      const mockResponse = {
        clearCookie: jest.fn(),
      };

      jest.spyOn(authClient, 'send').mockReturnValue(of({}));

      const result = await controller.logout(
        mockRequest as any,
        mockResponse as any,
      );

      expect(authClient.send).toHaveBeenCalledWith(
        { cmd: EAuthRoutes.logout },
        'token',
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        EAuthParams.accessToken,
      );
      expect(result).toEqual({
        success: true,
        message: Messages.SUCCESS_LOGOUT,
      });
    });
  });

  describe('rotateToken', () => {
    it('should call authClient.send with correct parameters and set new cookie', async () => {
      const mockRequest = {
        cookies: {
          [EAuthParams.accessToken]: 'oldToken',
        },
      };
      const mockResponse = {
        cookie: jest.fn(),
      };

      jest
        .spyOn(authClient, 'send')
        .mockReturnValue(of({ [EAuthParams.accessToken]: 'newToken' }));

      const result = await controller.rotateToken(
        mockRequest as any,
        mockResponse as any,
      );

      expect(authClient.send).toHaveBeenCalledWith(
        { cmd: EAuthRoutes.rotateToken },
        'oldToken',
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        EAuthParams.accessToken,
        'newToken',
        expect.any(Object),
      );
      expect(result).toEqual({
        success: true,
        message: Messages.SUCCESS_TOKEN_ROTATION,
      });
    });

    it('should throw UnauthorizedException when token is missing', async () => {
      const mockRequest = {
        cookies: {},
      };
      const mockResponse = {};

      await expect(
        controller.rotateToken(mockRequest as any, mockResponse as any),
      ).rejects.toThrow(Messages.ERROR_INVALID_TOKEN);
    });
  });
});

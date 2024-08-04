import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { of, lastValueFrom } from 'rxjs';
import {
  EAuthRoutes,
  EProvider,
  EUsersProviderFields,
  appConfig,
  TAppConfig,
  UsersProviderDto,
  SigninDto,
  EAuthParams,
} from '@app/shared';
import { createMockAppConfig } from '@app/shared/tests/mocks/app-config.mock';
import { AuthModule } from '../src/modules/auth.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authClientProxy: ClientProxy;
  let mockConfig: TAppConfig;

  beforeAll(async () => {
    mockConfig = createMockAppConfig();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        ClientsModule.register([
          {
            name: mockConfig.AUTH_MICROSERVICE_NAME,
            transport: Transport.TCP,
          },
        ]),
      ],
    })
      .overrideProvider(mockConfig.AUTH_MICROSERVICE_NAME)
      .useValue({
        send: jest.fn((pattern) => {
          if (pattern.cmd === `${EAuthRoutes.local}/${EAuthRoutes.signup}`) {
            return of({ [EAuthParams.accessToken]: 'mockToken' });
          }
          if (pattern.cmd === `${EAuthRoutes.local}/${EAuthRoutes.signin}`) {
            return of({ [EAuthParams.accessToken]: 'mockToken' });
          }
          if (pattern.cmd === EAuthRoutes.logout) {
            return of({ success: true });
          }
          if (pattern.cmd === EAuthRoutes.validateToken) {
            return of(true);
          }
          if (pattern.cmd === EAuthRoutes.rotateToken) {
            return of({ [EAuthParams.accessToken]: 'newMockToken' });
          }
          return of(null);
        }),
      })
      .overrideProvider(appConfig.KEY)
      .useValue(mockConfig)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authClientProxy = moduleFixture.get<ClientProxy>(
      mockConfig.AUTH_MICROSERVICE_NAME,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it(`/${EAuthRoutes.local}/${EAuthRoutes.signup} (POST)`, async () => {
    const signupDto: Partial<UsersProviderDto> = {
      [EUsersProviderFields.providerName]: EProvider.local,
      [EUsersProviderFields.email]: 'test@example.com',
      [EUsersProviderFields.login]: 'testuser',
      [EUsersProviderFields.password]: 'Password123!',
      [EUsersProviderFields.repeatPassword]: 'Password123!',
      [EUsersProviderFields.agreement]: 'agreed',
    };

    const response = await lastValueFrom(
      authClientProxy.send(
        { cmd: `${EAuthRoutes.local}/${EAuthRoutes.signup}` },
        signupDto,
      ),
    );
    expect(response).toHaveProperty(EAuthParams.accessToken);
    expect(response[EAuthParams.accessToken]).toBe('mockToken');
  });

  it(`/${EAuthRoutes.local}/${EAuthRoutes.signin} (POST)`, async () => {
    const signinDto: SigninDto = {
      [EUsersProviderFields.emailOrLogin]: 'test@example.com',
      [EUsersProviderFields.password]: 'Password123!',
    };

    const response = await lastValueFrom(
      authClientProxy.send(
        { cmd: `${EAuthRoutes.local}/${EAuthRoutes.signin}` },
        signinDto,
      ),
    );
    expect(response).toHaveProperty(EAuthParams.accessToken);
    expect(response[EAuthParams.accessToken]).toBe('mockToken');
  });

  it(`/${EAuthRoutes.logout} (POST)`, async () => {
    const token = 'mockToken';

    const response = await lastValueFrom(
      authClientProxy.send({ cmd: EAuthRoutes.logout }, token),
    );
    expect(response.success).toBe(true);
  });

  it(`/${EAuthRoutes.validateToken} (POST)`, async () => {
    const token = 'mockToken';

    const response = await lastValueFrom(
      authClientProxy.send({ cmd: EAuthRoutes.validateToken }, token),
    );
    expect(response).toBe(true);
  });

  it(`/${EAuthRoutes.rotateToken} (POST)`, async () => {
    const token = 'mockToken';

    const response = await lastValueFrom(
      authClientProxy.send({ cmd: EAuthRoutes.rotateToken }, token),
    );
    expect(response).toHaveProperty(EAuthParams.accessToken);
    expect(response[EAuthParams.accessToken]).toBe('newMockToken');
  });
});

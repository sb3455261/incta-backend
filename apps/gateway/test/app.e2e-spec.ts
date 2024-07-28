import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { of } from 'rxjs';
import {
  EGatewayRoutes,
  EUsersRoutes,
  EProvider,
  EUsersProviderFields,
} from '@app/shared';
import { createMockAppConfig } from '@app/shared/tests/mocks/app-config.mock';
import { GatewayModule } from '../src/gateway.module';

describe('GatewayController (e2e)', () => {
  let app: INestApplication;
  const mockAppConfig = createMockAppConfig();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        GatewayModule,
        ClientsModule.register([
          {
            name: mockAppConfig.USERS_MICROSERVICE_NAME,
            transport: Transport.TCP,
          },
        ]),
      ],
    })
      .overrideProvider(mockAppConfig.USERS_MICROSERVICE_NAME)
      .useValue({
        send: jest.fn((pattern) => {
          if (pattern.cmd === EUsersRoutes.findAllUsers) {
            return of([
              { id: '1', email: 'test@example.com', name: 'Test User' },
            ]);
          }
          if (pattern.cmd === EUsersRoutes.createUser) {
            return of({ id: '2' });
          }
          return undefined;
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix(mockAppConfig.APP_API_PREFIX);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it(`/${EGatewayRoutes.users} (GET)`, () =>
    request(app.getHttpServer())
      .get(`/${mockAppConfig.APP_API_PREFIX}/${EGatewayRoutes.users}`)
      .expect(200)
      .expect([{ id: '1', email: 'test@example.com', name: 'Test User' }]));

  it(`/${EGatewayRoutes.users} (POST)`, () => {
    const createUserDto = {
      [EUsersProviderFields.providerName]: EProvider.local,
      [EUsersProviderFields.email]: 'new@example.com',
      [EUsersProviderFields.login]: 'newuser',
      [EUsersProviderFields.name]: 'New',
      [EUsersProviderFields.surname]: 'User',
      [EUsersProviderFields.password]: 'Password123!',
      [EUsersProviderFields.avatar]: 'https://example.com/avatar.jpg',
      [EUsersProviderFields.emailIsValidated]: false,
    };

    return request(app.getHttpServer())
      .post(`/${mockAppConfig.APP_API_PREFIX}/${EGatewayRoutes.users}`)
      .send(createUserDto)
      .expect(201)
      .expect({ id: '2' });
  });
});

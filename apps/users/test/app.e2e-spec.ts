import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Transport, ClientProxy, ClientsModule } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { EUsersRoutes, EProvider, EUsersProviderFields } from '@app/shared';
import { createMockAppConfig } from '@app/shared/tests/mocks/app-config.mock';
import { mockPrismaService } from './users-prisma.mock';
import { UsersModule } from '../src/application/users.module';
import { PrismaService } from '../src/infrastructure/persistence/prisma/prisma.service';
import { UserRepository } from '../src/application/ports/user-abstract.repository';
import { EUserInfrastuctureDriver } from '../src/infrastructure/persistence/users-infrastructure.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let client: ClientProxy;
  const mockAppConfig = createMockAppConfig();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        UsersModule.register(EUserInfrastuctureDriver.prisma),
        ClientsModule.register([
          {
            name: mockAppConfig.USERS_MICROSERVICE_NAME,
            transport: Transport.TCP,
            options: {
              host: '0.0.0.0',
              port: mockAppConfig.USERS_MICROSERVICE_PORT,
            },
          },
        ]),
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(UserRepository)
      .useValue({
        findAll: jest
          .fn()
          .mockResolvedValue([
            { id: '1', email: 'test@example.com', name: 'Test User' },
          ]),
        create: jest.fn().mockResolvedValue({ id: '2' }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.connectMicroservice({
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: mockAppConfig.USERS_MICROSERVICE_PORT,
      },
    });

    await app.startAllMicroservices();
    await app.init();

    client = moduleFixture.get<ClientProxy>(
      mockAppConfig.USERS_MICROSERVICE_NAME,
    );
    await client.connect();
  });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
    if (app) {
      await app.close();
    }
  });

  afterAll(async () => {
    await client.close();
    await app.close();
  });

  it('should return all users', async () => {
    const result = await lastValueFrom(
      client.send({ cmd: EUsersRoutes.findAllUsers }, {}),
    );

    expect(result).toEqual([
      { id: '1', email: 'test@example.com', name: 'Test User' },
    ]);
  });

  it('should create a new user', async () => {
    const userProviderData = {
      [EUsersProviderFields.providerName]: EProvider.local,
      [EUsersProviderFields.email]: 'new@example.com',
      [EUsersProviderFields.login]: 'newuser',
      [EUsersProviderFields.name]: 'New',
      [EUsersProviderFields.surname]: 'User',
      [EUsersProviderFields.password]: 'Password123!',
      [EUsersProviderFields.avatar]: 'https://example.com/avatar.jpg',
      [EUsersProviderFields.emailIsValidated]: false,
    };

    const result = await lastValueFrom(
      client.send({ cmd: EUsersRoutes.createUser }, userProviderData),
    );

    expect(result).toEqual({ id: '2' });
  });
});

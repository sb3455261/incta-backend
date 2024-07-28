import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Transport, ClientProxy, ClientsModule } from '@nestjs/microservices';
import { lastValueFrom, timeout, catchError } from 'rxjs';
import {
  EUsersRoutes,
  EProvider,
  EUsersProviderFields,
  appConfig,
} from '@app/shared';
import { UsersModule } from '../src/application/users.module';
import { PrismaService } from '../src/infrastructure/persistence/prisma/prisma.service';
import { UserRepository } from '../src/application/ports/user-abstract.repository';
import { EUserInfrastuctureDriver } from '../src/infrastructure/persistence/users-infrastructure.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let client: ClientProxy;
  const config = appConfig();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        UsersModule.register(EUserInfrastuctureDriver.prisma),
        ClientsModule.register([
          {
            name: config.USERS_MICROSERVICE_NAME,
            transport: Transport.TCP,
            options: {
              host: '0.0.0.0',
              port: config.USERS_MICROSERVICE_PORT,
            },
          },
        ]),
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findMany: jest
            .fn()
            .mockResolvedValue([
              { id: '1', email: 'test@example.com', name: 'Test User' },
            ]),
          create: jest.fn().mockResolvedValue({ id: '2' }),
        },
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .overrideProvider(UserRepository)
      .useValue({
        findAll: jest
          .fn()
          .mockResolvedValue([
            { id: '1', email: 'test@example.com', name: 'Test User' },
          ]),
        create: jest.fn().mockResolvedValue({ id: '2' }),
        findUsersProvider: jest.fn().mockResolvedValue(null),
        findProvider: jest.fn().mockResolvedValue({ id: 'providerId' }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.connectMicroservice({
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: config.USERS_MICROSERVICE_PORT,
      },
    });

    await app.startAllMicroservices();
    await app.init();

    client = moduleFixture.get<ClientProxy>(config.USERS_MICROSERVICE_NAME);
    await client.connect();
  });

  afterAll(async () => {
    await client.close();
    await app.close();
  });

  it('should return all users', async () => {
    const result = await lastValueFrom(
      client.send({ cmd: EUsersRoutes.findAllUsers }, {}).pipe(
        timeout(5000),
        catchError((error) => {
          console.error('Error in findAllUsers:', error);
          throw error;
        }),
      ),
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
        client.send({ cmd: EUsersRoutes.createUser }, userProviderData).pipe(
          timeout(5000),
          catchError((error) => {
            console.error('Error in createUser observable:', error);
            throw error;
          }),
        ),
      );
      expect(result).toEqual({ id: '2' });
  });
});

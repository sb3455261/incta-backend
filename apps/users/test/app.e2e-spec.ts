import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Transport, ClientsModule, ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { EUsersRoutes , appConfig as originalAppConfig } from '@app/shared';
import { mockAppConfig } from '@app/shared/tests/mocks/app-config.mock';
import { UsersModule } from '../src/users.module';
import { UserRepository } from '../src/repositories/user-repository/user-abstract.repository';
import { mockPrismaService } from './users-prisma.mock';
import { PrismaService } from '../src/repositories/prisma-repository/prisma.service';

const mockAppConfigFn = jest.fn(() => mockAppConfig);

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let client: ClientProxy;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        UsersModule,
        ClientsModule.register([
          {
            name: mockAppConfigFn().USERS_MICROSERVICE_NAME,
            transport: Transport.TCP,
            options: {
              host: '0.0.0.0',
              port: mockAppConfigFn().USERS_MICROSERVICE_PORT,
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
      })
      .overrideProvider(originalAppConfig.KEY)
      .useFactory({
        factory: () => mockAppConfigFn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.connectMicroservice({
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: mockAppConfigFn().USERS_MICROSERVICE_PORT,
      },
    });

    await app.startAllMicroservices();
    await app.init();

    client = moduleFixture.get<ClientProxy>(
      mockAppConfigFn().USERS_MICROSERVICE_NAME,
    );
    await client.connect();
  });

  afterAll(async () => {
    await client.close();
    await app.close();
  });

  it('should return users (TCP)', async () => {
    const result = await lastValueFrom(
      client.send({ cmd: EUsersRoutes.getusers }, {}),
    ).catch((error) => {
      console.error('Error in test:', error);
      throw error;
    });

    expect(result).toContain('Hello World 1!');
    expect(result).toContain(
      `is running on port ${mockAppConfigFn().USERS_MICROSERVICE_PORT}`,
    );
    expect(result).toContain('USERS_DATABASE_URL is set to:');
    expect(result).toContain(
      JSON.stringify([
        { id: '1', email: 'test@example.com', name: 'Test User' },
      ]),
    );
  });
});

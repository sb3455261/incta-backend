import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { appConfig, AppConfigModule, TAppConfig } from '@app/shared';
import { ConfigModule } from '@nestjs/config';
import { UsersProxyController } from './controllers/users.proxy.controller';
import { AuthProxyController } from './controllers/auth.proxy.controller';

const config = appConfig();

@Module({
  imports: [
    AppConfigModule,
    ClientsModule.registerAsync([
      {
        name: config.USERS_MICROSERVICE_NAME,
        imports: [ConfigModule],
        useFactory: async (_appConfig: TAppConfig) => ({
          transport: Transport.TCP,
          options: {
            host: _appConfig.USERS_MICROSERVICE_HOST,
            port: _appConfig.USERS_MICROSERVICE_PORT,
          },
        }),
        inject: [appConfig.KEY],
      },
    ]),
    ClientsModule.registerAsync([
      {
        name: config.AUTH_MICROSERVICE_NAME,
        imports: [ConfigModule],
        useFactory: async (_appConfig: TAppConfig) => ({
          transport: Transport.TCP,
          options: {
            host:
              process.env.NODE_ENV === 'development'
                ? undefined
                : _appConfig.AUTH_MICROSERVICE_HOST,
            port: _appConfig.AUTH_MICROSERVICE_PORT,
          },
        }),
        inject: [appConfig.KEY],
      },
    ]),
  ],
  controllers: [UsersProxyController, AuthProxyController],
})
export class GatewayModule {}

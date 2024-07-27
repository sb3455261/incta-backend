import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { appConfig, AppConfigModule, TAppConfig } from '@app/shared';
import { ConfigModule } from '@nestjs/config';
import { UsersProxyController } from './controllers/users.proxy.controller';

@Module({
  imports: [
    AppConfigModule,
    ClientsModule.registerAsync([
      {
        name: appConfig().USERS_MICROSERVICE_NAME,
        imports: [ConfigModule],
        useFactory: async (_appConfig: TAppConfig) => ({
          transport: Transport.TCP,
          options: {
            host:
              process.env.NODE_ENV === 'development'
                ? undefined
                : _appConfig.USERS_MICROSERVICE_HOST,
            port: _appConfig.USERS_MICROSERVICE_PORT,
          },
        }),
        inject: [appConfig.KEY],
      },
    ]),
  ],
  controllers: [UsersProxyController],
})
export class GatewayModule {}

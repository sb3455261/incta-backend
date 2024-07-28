import { DynamicModule, Module } from '@nestjs/common';
import { AppConfigModule } from '@app/shared';
import { UsersService } from './users.service';
import { UsersController } from '../presenters/tcp/users.controller';
import { UserFactory } from '../domain/factories/user.factory';
import {
  EUserInfrastuctureDriver,
  UserInfrastructureModule,
} from '../infrastructure/persistence/users-infrastructure.module';

@Module({})
export class UsersModule {
  static register(driver: EUserInfrastuctureDriver): DynamicModule {
    return {
      module: UsersModule,
      imports: [AppConfigModule, UserInfrastructureModule.use(driver)],
      controllers: [UsersController],
      providers: [UsersService, UserFactory],
    };
  }
}

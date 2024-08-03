import { DynamicModule, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AppConfigModule } from '@app/shared';
import { UsersService } from './users.service';
import { UsersController } from '../presenters/tcp/users.controller';
import {
  EUserInfrastuctureDriver,
  UserInfrastructureModule,
} from '../infrastructure/persistence/users-infrastructure.module';
import { UserFactory } from '../domain/factories/user.factory';
import { UsersProviderFactory } from '../domain/factories/users-provider.factory';
import { CreateUsersProviderCommandHandler } from './commands/create-users-provider.command.handler';
import { GetAllUsersQueryHandler } from './queries/get-all-users.query.handler';
import { CreateUserCommandHandler } from './commands/create-user.command.handler';
import { FindUsersProviderQueryHandler } from './queries/find-users-provider.query.handler';
import { FindProviderQueryHandler } from './queries/find-provider.query.handler';
import { UpdateUsersProviderCommandHandler } from './commands/update-users-provider.command.handler';
import { DeleteUserCommandHandler } from './commands/delete-user.command.handler';
import { EmailNotifierModule } from '../../../email-notifier/email-notifier.module';
import { EmailNotifierService } from '../../../email-notifier/email-notifier.service';

@Module({})
export class UsersModule {
  static register(driver: EUserInfrastuctureDriver): DynamicModule {
    return {
      module: UsersModule,
      imports: [
        CqrsModule.forRoot(),
        AppConfigModule,
        UserInfrastructureModule.use(driver),
        EmailNotifierModule
      ],
      controllers: [UsersController],
      providers: [
        EmailNotifierService,
        UsersService,
        UserFactory,
        UsersProviderFactory,
        CreateUserCommandHandler,
        CreateUsersProviderCommandHandler,
        UpdateUsersProviderCommandHandler,
        DeleteUserCommandHandler,
        GetAllUsersQueryHandler,
        FindUsersProviderQueryHandler,
        FindProviderQueryHandler,
      ],
    };
  }
}

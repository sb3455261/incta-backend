import { Injectable } from '@nestjs/common';
import { EProvider, EUsersProviderFields } from '@app/shared';
import { User } from '../user';
import { CreateUsersProviderCommand } from '../../application/commands/create-users-provider.command';
import { UsersProviderFactory } from './users-provider.factory';

@Injectable()
export class UserFactory {
  constructor(private readonly usersProviderFactory: UsersProviderFactory) {}

  create(usersProvider: CreateUsersProviderCommand, id?: string): User {
    return User.create(
      id,
      usersProvider[EUsersProviderFields.providerName] as EProvider,
      this.usersProviderFactory.create(
        id,
        usersProvider[EUsersProviderFields.providerName] as EProvider,
        usersProvider,
      ),
    );
  }
}

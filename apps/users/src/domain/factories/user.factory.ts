import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { User } from '../user';
import { CreateUsersProviderCommand } from '../../application/commands/create-users-provider.command';

@Injectable()
export class UserFactory {
  create(usersProvider: CreateUsersProviderCommand) {
    const id = randomUUID();
    const user = new User(id, usersProvider);

    return user;
  }
}

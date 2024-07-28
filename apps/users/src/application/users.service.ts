import { EUserFields } from '@app/shared';
import { Injectable } from '@nestjs/common';
import { UserRepository } from './ports/user-abstract.repository';
import { UserFactory } from '../domain/factories/user.factory';
import { User } from '../domain/user';
import { CreateUsersProviderCommand } from './commands/create-users-provider.command';

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UserRepository,
    private readonly userFactory: UserFactory,
  ) {}

  async findAll(): Promise<User[]> {
    return this.repository.findAll();
  }

  async create(
    usersProvider: CreateUsersProviderCommand,
  ): Promise<Omit<User, EUserFields.providers>> {
    const user = this.userFactory.create(usersProvider);
    return this.repository.create(user);
  }
}

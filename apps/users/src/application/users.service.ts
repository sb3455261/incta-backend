import {
  EDbEntityFields,
  EUserFields,
  EUsersProviderFields,
  IUser,
} from '@app/shared';
import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserRepository } from './ports/user-abstract.repository';
import { CreateUsersProviderCommand } from './commands/create-users-provider.command';
import { UserFactory } from '../domain/factories/user.factory';
import { GetAllUsersQuery } from './queries/get-all-users.query';
import { CreateUserCommand } from './commands/create-user.command';
import { FindUsersProviderQuery } from './queries/find-users-provider.query';
import { FindProviderQuery } from './queries/find-provider.query';

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UserRepository,
    private readonly userFactory: UserFactory,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async findAll(): Promise<IUser[]> {
    return this.queryBus.execute(new GetAllUsersQuery());
  }

  async create(
    usersProvider: CreateUsersProviderCommand,
  ): Promise<Omit<IUser, EUserFields.providers>> {
    const existingWithEmailUsersProvider = await this.queryBus.execute(
      new FindUsersProviderQuery({
        [EUsersProviderFields.email]: usersProvider[EUsersProviderFields.email],
      }),
    );

    const user = this.userFactory.create(
      usersProvider,
      existingWithEmailUsersProvider?.[EUsersProviderFields.userLocalId],
    );
    const provider = await this.queryBus.execute(
      new FindProviderQuery(user.getProviderName()),
    );
    user.setProviderLocalId(provider.id);

    if (user.isLocalProvider() && !existingWithEmailUsersProvider) {
      return this.commandBus.execute(new CreateUserCommand(user));
    }
    const newUsersProvider = user.getUsersProvider();

    const existingWithEmailAndProviderUsersProvider =
      await this.queryBus.execute(
        new FindUsersProviderQuery({
          [EUsersProviderFields.email]:
            newUsersProvider[EUsersProviderFields.email],
          [EUsersProviderFields.providerLocalId]:
            newUsersProvider[EUsersProviderFields.providerLocalId],
        }),
      );

    if (existingWithEmailAndProviderUsersProvider && !user.isLocalProvider()) {
      await this.repository.update(
        existingWithEmailAndProviderUsersProvider[EDbEntityFields.id],
        {
          [EUsersProviderFields.name]:
            newUsersProvider[EUsersProviderFields.name],
          [EUsersProviderFields.surname]:
            newUsersProvider[EUsersProviderFields.surname],
          [EUsersProviderFields.password]:
            newUsersProvider[EUsersProviderFields.password],
          [EUsersProviderFields.avatar]:
            newUsersProvider[EUsersProviderFields.avatar],
        },
      );
      return {
        [EDbEntityFields.id]:
          existingWithEmailAndProviderUsersProvider[
            EUsersProviderFields.userLocalId
          ],
      };
    }

    const existingWithProviderIdUsersProvider = await this.queryBus.execute(
      new FindUsersProviderQuery({
        [EUsersProviderFields.sub]: newUsersProvider[EUsersProviderFields.sub],
        [EUsersProviderFields.providerLocalId]:
          newUsersProvider[EUsersProviderFields.providerLocalId],
      }),
    );
    if (existingWithProviderIdUsersProvider && !user.isLocalProvider()) {
      await this.repository.update(
        existingWithProviderIdUsersProvider[EDbEntityFields.id],
        {
          [EUsersProviderFields.email]:
            newUsersProvider[EUsersProviderFields.email],
          [EUsersProviderFields.login]:
            newUsersProvider[EUsersProviderFields.login],
          [EUsersProviderFields.name]:
            newUsersProvider[EUsersProviderFields.name],
          [EUsersProviderFields.surname]:
            newUsersProvider[EUsersProviderFields.surname],
          [EUsersProviderFields.password]:
            newUsersProvider[EUsersProviderFields.password],
          [EUsersProviderFields.avatar]:
            newUsersProvider[EUsersProviderFields.avatar],
        },
      );
      return {
        [EDbEntityFields.id]:
          existingWithProviderIdUsersProvider[EUsersProviderFields.userLocalId],
      };
    }

    if (existingWithEmailUsersProvider) {
      const createUsersProviderCommand = new CreateUsersProviderCommand(
        user.getProviderName(),
        existingWithEmailUsersProvider[EUsersProviderFields.sub],
        existingWithEmailUsersProvider[EUsersProviderFields.email],
        newUsersProvider[EUsersProviderFields.login],
        newUsersProvider[EUsersProviderFields.name],
        newUsersProvider[EUsersProviderFields.surname],
        newUsersProvider[EUsersProviderFields.password],
        newUsersProvider[EUsersProviderFields.avatar],
        newUsersProvider[EUsersProviderFields.emailIsValidated],
        existingWithEmailUsersProvider[EUsersProviderFields.userLocalId],
      );
      await this.commandBus.execute(createUsersProviderCommand);

      return {
        [EDbEntityFields.id]:
          existingWithEmailUsersProvider[EUsersProviderFields.userLocalId],
      };
    }

    return this.commandBus.execute(new CreateUserCommand(user));
  }
}

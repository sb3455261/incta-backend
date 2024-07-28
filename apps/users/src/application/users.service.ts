import {
  EDbEntityFields,
  EUserFields,
  EUsersProviderFields,
  IUser,
} from '@app/shared';
import { Injectable } from '@nestjs/common';
import { UserRepository } from './ports/user-abstract.repository';
import { UserFactory } from '../domain/factories/user.factory';
import { CreateUsersProviderCommand } from './commands/create-users-provider.command';

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UserRepository,
    private readonly userFactory: UserFactory,
  ) {}

  async findAll(): Promise<IUser[]> {
    return this.repository.findAll();
  }

  async create(
    usersProvider: CreateUsersProviderCommand,
  ): Promise<Omit<IUser, EUserFields.providers>> {
    const existingWithEmailUsersProvider =
      await this.repository.findUsersProvider({
        [EUsersProviderFields.email]: usersProvider[EUsersProviderFields.email],
      });

    const user = this.userFactory.create(
      usersProvider,
      existingWithEmailUsersProvider?.[EUsersProviderFields.userLocalId],
    );
    const provider = await this.repository.findProvider(user.getProviderName());
    user.setProviderLocalId(provider.id);
    if (user.isLocalProvider() && !existingWithEmailUsersProvider) {
      return this.repository.create(user);
    }
    const newUsersProvider = user.getUsersProvider();
    const existingWithEmailAndProviderUsersProvider =
      await this.repository.findUsersProvider({
        [EUsersProviderFields.email]:
          newUsersProvider[EUsersProviderFields.email],
        [EUsersProviderFields.providerLocalId]:
          newUsersProvider[EUsersProviderFields.providerLocalId],
      });
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

    const existingWithProviderIdUsersProvider =
      await this.repository.findUsersProvider({
        [EUsersProviderFields.sub]: newUsersProvider[EUsersProviderFields.sub],
        [EUsersProviderFields.providerLocalId]:
          newUsersProvider[EUsersProviderFields.providerLocalId],
      });
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
      await this.repository.createProvider(
        existingWithEmailUsersProvider[EUsersProviderFields.userLocalId],
        {
          [EUsersProviderFields.providerLocalId]:
            newUsersProvider[EUsersProviderFields.providerLocalId],
          [EUsersProviderFields.sub]:
            newUsersProvider[EUsersProviderFields.sub],
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
          [EUsersProviderFields.emailIsValidated]: true,
        },
      );
      return {
        [EDbEntityFields.id]:
          existingWithEmailUsersProvider[EUsersProviderFields.userLocalId],
      };
    }

    return this.repository.create(user);
  }
}

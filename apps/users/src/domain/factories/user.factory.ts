import { Injectable } from '@nestjs/common';
import {
  EDbEntityFields,
  EProvider,
  EUsersProviderFields,
  IUsersProvider,
} from '@app/shared';
import { User } from '../user';
import { CreateUsersProviderCommand } from '../../application/commands/create-users-provider.command';

@Injectable()
export class UserFactory {
  create(usersProvider: CreateUsersProviderCommand, id?: string): User {
    return User.create(
      this.mapCommandToProviderData(usersProvider),
      usersProvider[EUsersProviderFields.providerName] as EProvider,
      id,
    );
  }

  private mapCommandToProviderData(
    data: CreateUsersProviderCommand,
  ): Omit<
    IUsersProvider,
    | EDbEntityFields.id
    | EUsersProviderFields.userLocalId
    | EUsersProviderFields.providerLocalId
  > {
    return {
      [EUsersProviderFields.sub]: data[EUsersProviderFields.sub],
      [EUsersProviderFields.email]: data[EUsersProviderFields.email],
      [EUsersProviderFields.login]: data[EUsersProviderFields.login],
      [EUsersProviderFields.name]: data[EUsersProviderFields.name],
      [EUsersProviderFields.surname]: data[EUsersProviderFields.surname],
      [EUsersProviderFields.password]: data[EUsersProviderFields.password],
      [EUsersProviderFields.avatar]: data[EUsersProviderFields.avatar],
      [EUsersProviderFields.emailIsValidated]:
        data[EUsersProviderFields.providerName] !== EProvider.local,
    };
  }
}

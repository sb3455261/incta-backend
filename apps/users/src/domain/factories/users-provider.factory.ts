import { Injectable } from '@nestjs/common';
import {
  EDbEntityFields,
  EProvider,
  EUsersProviderFields,
  IUsersProvider,
} from '@app/shared';
import { CreateUsersProviderCommand } from '../../application/commands/create-users-provider.command';
import { UsersProvider } from '../users-provider';

@Injectable()
export class UsersProviderFactory {
  create(
    userId: string,
    providerName: EProvider,
    usersProvider: CreateUsersProviderCommand,
  ): IUsersProvider {
    return UsersProvider.create(
      userId,
      providerName,
      this.mapCommandToProviderData(usersProvider),
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

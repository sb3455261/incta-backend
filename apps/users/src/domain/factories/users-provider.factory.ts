import { Injectable } from '@nestjs/common';
import {
  BcryptService,
  EDbEntityFields,
  EProvider,
  EUsersProviderFields,
  IUsersProvider,
} from '@app/shared';
import { CreateUsersProviderCommand } from '../../application/commands/create-users-provider.command';
import { UsersProvider } from '../users-provider';

@Injectable()
export class UsersProviderFactory {
  constructor(private readonly bcryptService: BcryptService) {}

  async create(
    userId: string,
    providerName: EProvider,
    usersProvider: CreateUsersProviderCommand,
  ): Promise<IUsersProvider> {
    return UsersProvider.create(
      userId,
      providerName,
      await this.mapCommandToProviderData(usersProvider),
    );
  }

  private async mapCommandToProviderData(
    data: CreateUsersProviderCommand,
  ): Promise<
    Omit<
      IUsersProvider,
      | EDbEntityFields.id
      | EUsersProviderFields.userLocalId
      | EUsersProviderFields.providerLocalId
    >
  > {
    console.debug('mapCommandToProviderData 1');
    const result = {
      [EUsersProviderFields.sub]: data[EUsersProviderFields.sub],
      [EUsersProviderFields.email]: data[EUsersProviderFields.email],
      [EUsersProviderFields.login]: data[EUsersProviderFields.login],
      [EUsersProviderFields.name]: data[EUsersProviderFields.name],
      [EUsersProviderFields.surname]: data[EUsersProviderFields.surname],
      [EUsersProviderFields.password]: await this.hashPassword(
        data[EUsersProviderFields.password],
      ),
      [EUsersProviderFields.avatar]: data[EUsersProviderFields.avatar],
      [EUsersProviderFields.emailIsValidated]:
        data[EUsersProviderFields.providerName] !== EProvider.local,
    };
    console.debug('mapCommandToProviderData 2');
    return result;
  }

  async hashPassword(password: string) {
    console.debug('UsersProviderFactory 2', password, 'password');
    const hash = await this.bcryptService
      .hash(password)
      .catch((error) => console.debug(error));
    console.debug('UsersProviderFactory 3', hash, 'hash');
    return hash || 'HASH';
  }
}

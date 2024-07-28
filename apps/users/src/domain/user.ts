import { EUserFields, IUser, IUsersProvider } from '@app/shared';
import { CreateUsersProviderCommand } from '../application/commands/create-users-provider.command';

export class User implements IUser {
  public [EUserFields.providers]: IUsersProvider[];

  constructor(
    public id: string,
    provider: CreateUsersProviderCommand,
  ) {
    this[EUserFields.providers] = [provider];
  }
}

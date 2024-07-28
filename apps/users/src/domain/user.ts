import {
  EDbEntityFields,
  EProvider,
  EUserFields,
  EUsersProviderFields,
  IUser,
  IUsersProvider,
} from '@app/shared';
import { randomUUID } from 'crypto';

export class User implements IUser {
  public readonly [EUserFields.providers]: IUsersProvider[];

  constructor(
    public id: string,
    provider: IUsersProvider,
    public readonly providerName: EProvider,
  ) {
    this[EUserFields.providers] = [provider];
  }

  static create(
    providerData: Omit<
      IUsersProvider,
      | EDbEntityFields.id
      | EUsersProviderFields.userLocalId
      | EUsersProviderFields.providerLocalId
    >,
    providerName: EProvider,
    id: string,
  ): User {
    const userId = id || randomUUID();
    const providerId = randomUUID();
    const provider: IUsersProvider = {
      ...providerData,
      [EUsersProviderFields.sub]:
        providerName === EProvider.local
          ? userId
          : providerData[EUsersProviderFields.sub],
      id: providerId,
    };

    return new User(userId, provider, providerName);
  }

  getUsersProvider(): IUsersProvider {
    return this.providers[0];
  }

  setProviderLocalId(providerLocalId: string): void {
    this.providers[0][EUsersProviderFields.providerLocalId] = providerLocalId;
  }

  getProviderName(): EProvider {
    return this[EUsersProviderFields.providerName];
  }

  isLocalProvider(): boolean {
    return this.getProviderName() === EProvider.local;
  }

  toJSON(): IUser {
    return {
      id: this.id,
      providers: this.providers.map((provider) => ({
        ...provider,
        providerName: undefined,
      })),
    };
  }
}

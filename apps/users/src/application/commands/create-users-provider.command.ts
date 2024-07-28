import { EDbEntityFields, EProvider, EUsersProviderFields } from '@app/shared';
import { randomUUID } from 'crypto';

export class CreateUsersProviderCommand {
  public readonly [EDbEntityFields.id]: string;

  public readonly [EUsersProviderFields.password]: string;

  public readonly [EUsersProviderFields.sub]?: string;

  public readonly [EUsersProviderFields.login]: string;

  constructor(
    public readonly providerName: string,
    sub: string,
    public readonly email: string,
    login: string,
    public readonly name: string,
    public readonly surname: string,
    password: string,
    public readonly avatar: string,
    public readonly emailIsValidated: boolean,
  ) {
    this[EDbEntityFields.id] = randomUUID();
    this[EUsersProviderFields.password] = password || randomUUID();
    this[EUsersProviderFields.sub] =
      providerName !== EProvider.local ? sub : undefined;
    this[EUsersProviderFields.login] =
      providerName !== EProvider.local ? email : login;
  }
}

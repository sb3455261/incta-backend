import {
  EDbEntityFields,
  EProvider,
  EProviderFields,
  EUserFields,
  EUsersProviderFields,
  IUser,
  appConfig as _appConfig,
  TAppConfig,
  IUsersProvider,
} from '@app/shared';
import { Inject, Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUsersProviderCommand } from './commands/create-users-provider.command';
import { UserFactory } from '../domain/factories/user.factory';
import { GetAllUsersQuery } from './queries/get-all-users.query';
import { CreateUserCommand } from './commands/create-user.command';
import { FindUsersProviderQuery } from './queries/find-users-provider.query';
import { FindProviderQuery } from './queries/find-provider.query';
import { UpdateUsersProviderCommand } from './commands/update-users-provider.command';
import { User } from '../domain/user';

@Injectable()
export class UsersService {
  constructor(
    @Inject(_appConfig.KEY)
    private readonly appConfig: TAppConfig,
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
      // finds 'local' first
      new FindProviderQuery(user.getProviderName()),
    );
    user.setProviderLocalId(provider.id);
    const newUsersProvider = user.getUsersProvider();

    if (user.isLocalProvider()) {
      return this.createUserWithUsersLocalProviderOrUpdateUsersLocalProvider(
        user,
        newUsersProvider,
        existingWithEmailUsersProvider,
      );
    }
    return this.createUserWithusersExternalProviderOrUpdateUsersExternalProvider(
      user,
      newUsersProvider,
      existingWithEmailUsersProvider,
    );
  }

  private async createUsersProvider(
    user: User,
    newUsersProvider: IUsersProvider,
    existingUsersProvider: IUsersProvider,
  ): Promise<Omit<IUser, EUserFields.providers>> {
    const createUsersProviderCommand = new CreateUsersProviderCommand(
      user.getProviderName(),
      newUsersProvider[EUsersProviderFields.sub],
      existingUsersProvider[EUsersProviderFields.email],
      newUsersProvider[EUsersProviderFields.login],
      newUsersProvider[EUsersProviderFields.name],
      newUsersProvider[EUsersProviderFields.surname],
      newUsersProvider[EUsersProviderFields.password],
      newUsersProvider[EUsersProviderFields.avatar],
      newUsersProvider[EUsersProviderFields.emailIsValidated],
      existingUsersProvider[EUsersProviderFields.userLocalId],
    );
    await this.commandBus.execute(createUsersProviderCommand);
    return {
      [EDbEntityFields.id]:
        existingUsersProvider[EUsersProviderFields.userLocalId],
    };
  }

  private async updateUsersProvider(
    usersProviderId: string,
    newUsersProvider: IUsersProvider,
    fields: EUsersProviderFields[],
  ): Promise<void> {
    const updateData = fields.reduce((acc, field) => {
      acc[field] = newUsersProvider[field];
      return acc;
    }, {} as Partial<IUsersProvider>);

    await this.commandBus.execute(
      new UpdateUsersProviderCommand(usersProviderId, updateData),
    );
  }

  private async createUserWithUsersLocalProviderOrUpdateUsersLocalProvider(
    user: ReturnType<UserFactory['create']>,
    newUsersProvider: IUsersProvider,
    existingWithEmailUsersProvider: IUsersProvider,
  ): Promise<Omit<IUser, EUserFields.providers>> {
    // local
    // mail does not exist
    // should update -> !existingWithEmailUsersProvider<local> && login exists && !emailIsValidated
    // should throw -> !existingWithEmailUsersProvider<local> && login exists && emailIsValidated || !email && !login && will add
    // mail exists
    // mail exists with local
    // should throw -> existingWithEmailUsersProvider<local> && emailIsValidated
    // should update -> existingWithEmailUsersProvider<local> && !emailIsValidated
    // mail exists with non-local
    // console.log('should throw -> existingWithLoginUsersProvider && emailIsValidated')
    // console.log('should update -> existingWithLoginUsersProvider && !emailIsValidated')
    // should add to non-locals -> local does not exist

    const existingWithLoginUsersProvider = await this.queryBus.execute(
      new FindUsersProviderQuery({
        [EUsersProviderFields.login]:
          newUsersProvider[EUsersProviderFields.login],
      }),
    );

    // mail does not exist
    if (!existingWithEmailUsersProvider) {
      // login exists
      if (
        existingWithLoginUsersProvider &&
        !existingWithLoginUsersProvider[EUsersProviderFields.emailIsValidated]
      ) {
        // and login unconfirmed
        // console.log('should update -> login exists && !emailIsValidated')
        await this.updateUsersProvider(
          existingWithLoginUsersProvider[EDbEntityFields.id],
          newUsersProvider,
          [
            EUsersProviderFields.email,
            EUsersProviderFields.name,
            EUsersProviderFields.surname,
            EUsersProviderFields.password,
            EUsersProviderFields.avatar,
          ],
        );
        return {
          [EDbEntityFields.id]:
            existingWithLoginUsersProvider[EUsersProviderFields.userLocalId],
        };
      }

      // login does not exists or login confirmed
      // console.log('should throw -> login && emailIsValidated || !email && !login && will create UsersProvider<local>')
      return this.commandBus.execute(new CreateUserCommand(user));
    }

    // mail exists
    // should be always selectes with local first!
    const existingWithEmailUsersProviderProviderName =
      existingWithEmailUsersProvider[EUsersProviderFields.provider][
        EProviderFields.name
      ];

    // mail exists with local
    if (existingWithEmailUsersProviderProviderName === EProvider.local) {
      const emailIsValidated =
        existingWithEmailUsersProvider[EUsersProviderFields.emailIsValidated];
      if (emailIsValidated) {
        // console.log('should throw -> existingWithEmailUsersProvider<local> && emailIsValidated')
        return this.commandBus.execute(new CreateUserCommand(user));
      }
      // console.log('should update -> existingWithEmailUsersProvider<local> && !emailIsValidated')
      await this.updateUsersProvider(
        existingWithEmailUsersProvider[EDbEntityFields.id],
        newUsersProvider,
        [
          EUsersProviderFields.email,
          EUsersProviderFields.login,
          EUsersProviderFields.name,
          EUsersProviderFields.surname,
          EUsersProviderFields.password,
          EUsersProviderFields.avatar,
        ],
      );
      return {
        [EDbEntityFields.id]:
          existingWithEmailUsersProvider[EUsersProviderFields.userLocalId],
      };
    }

    // mail exists with non-local
    if (existingWithLoginUsersProvider) {
      const emailIsValidated =
        existingWithLoginUsersProvider[EUsersProviderFields.emailIsValidated];
      if (emailIsValidated) {
        // console.log('should throw -> existingWithEmailUsersProvider<local> && emailIsValidated')
        return this.commandBus.execute(new CreateUserCommand(user));
      }
      // console.log('should update -> existingWithLoginUsersProvider<local> && !emailIsValidated')
      await this.updateUsersProvider(
        existingWithLoginUsersProvider[EDbEntityFields.id],
        newUsersProvider,
        [
          EUsersProviderFields.email,
          EUsersProviderFields.login,
          EUsersProviderFields.name,
          EUsersProviderFields.surname,
          EUsersProviderFields.password,
          EUsersProviderFields.avatar,
        ],
      );
      return {
        [EDbEntityFields.id]:
          existingWithLoginUsersProvider[EUsersProviderFields.userLocalId],
      };
    }

    // should add to non-locals -> local does not exist
    return this.createUsersProvider(
      user,
      newUsersProvider,
      existingWithEmailUsersProvider,
    );
  }

  private async createUserWithusersExternalProviderOrUpdateUsersExternalProvider(
    user: User,
    newUsersProvider: IUsersProvider,
    existingWithEmailUsersProvider: IUsersProvider,
  ): Promise<Omit<IUser, EUserFields.providers>> {
    // non-local
    // email+provider && will update
    // sub+provider && will update
    // sub || provider email <- does not exist <- will add to existing
    // non-local does not exist -> will add

    const existingWithEmailAndProviderUsersProvider =
      await this.queryBus.execute(
        new FindUsersProviderQuery({
          [EUsersProviderFields.email]:
            newUsersProvider[EUsersProviderFields.email],
          [EUsersProviderFields.providerLocalId]:
            newUsersProvider[EUsersProviderFields.providerLocalId],
        }),
      );
    // email+provider && update
    if (existingWithEmailAndProviderUsersProvider) {
      await this.updateUsersProvider(
        existingWithEmailAndProviderUsersProvider[EDbEntityFields.id],
        newUsersProvider,
        [
          EUsersProviderFields.name,
          EUsersProviderFields.surname,
          EUsersProviderFields.password,
          EUsersProviderFields.avatar,
        ],
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
    // sub+provider && update
    if (existingWithProviderIdUsersProvider) {
      await this.updateUsersProvider(
        existingWithProviderIdUsersProvider[EDbEntityFields.id],
        newUsersProvider,
        [
          EUsersProviderFields.email,
          EUsersProviderFields.login,
          EUsersProviderFields.name,
          EUsersProviderFields.surname,
          EUsersProviderFields.password,
          EUsersProviderFields.avatar,
        ],
      );

      return {
        [EDbEntityFields.id]:
          existingWithProviderIdUsersProvider[EUsersProviderFields.userLocalId],
      };
    }

    // sub || provider email <- does not exist <- adds to existing
    if (existingWithEmailUsersProvider) {
      return this.createUsersProvider(
        user,
        newUsersProvider,
        existingWithEmailUsersProvider,
      );
    }

    // non-local does not exist -> will add
    return this.commandBus.execute(new CreateUserCommand(user));
  }
}

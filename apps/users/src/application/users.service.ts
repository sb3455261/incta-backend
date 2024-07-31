import {
  EDbEntityFields,
  EProvider,
  EProviderFields,
  EUserFields,
  EUsersProviderFields,
  IUser,
  appConfig as _appConfig,
  TAppConfig,
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

    // local
    // should update -> !existingWithEmailUsersProvider<local> && login exists && !emailIsValidated
    // should throw -> !existingWithEmailUsersProvider<local> && login exists && emailIsValidated || !email && !login && will add
    // should throw -> existingWithEmailUsersProvider<local> && emailIsValidated
    // should update -> existingWithEmailUsersProvider<local> && !emailIsValidated
    // should add to non-locals -> local does not exist

    if (user.isLocalProvider()) {
      // mail does not exist
      if (!existingWithEmailUsersProvider) {
        const existingWithLoginUsersProvider = await this.queryBus.execute(
          new FindUsersProviderQuery({
            [EUsersProviderFields.login]:
              newUsersProvider[EUsersProviderFields.login],
          }),
        );
        // login exists
        if (
          existingWithLoginUsersProvider &&
          !existingWithLoginUsersProvider[EUsersProviderFields.emailIsValidated]
        ) {
          // and login unconfirmed
          // console.log('should update -> login exists && !emailIsValidated')
          await this.commandBus.execute(
            new UpdateUsersProviderCommand(
              existingWithLoginUsersProvider[EDbEntityFields.id],
              {
                [EUsersProviderFields.email]:
                  newUsersProvider[EUsersProviderFields.email],
                [EUsersProviderFields.name]:
                  newUsersProvider[EUsersProviderFields.name],
                [EUsersProviderFields.surname]:
                  newUsersProvider[EUsersProviderFields.surname],
                [EUsersProviderFields.password]:
                  newUsersProvider[EUsersProviderFields.password],
                [EUsersProviderFields.avatar]:
                  newUsersProvider[EUsersProviderFields.avatar],
              },
            ),
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
      const existingWithEmailUsersProviderProviderName =
        existingWithEmailUsersProvider[EUsersProviderFields.provider][
          EProviderFields.name
        ];
      if (existingWithEmailUsersProviderProviderName === EProvider.local) {
        const emailIsValidated =
          existingWithEmailUsersProvider[EUsersProviderFields.emailIsValidated];
        if (emailIsValidated) {
          // console.log('should throw -> existingWithEmailUsersProvider<local> && emailIsValidated')
          return this.commandBus.execute(new CreateUserCommand(user));
        }
        // console.log('should update -> existingWithEmailUsersProvider<local> && !emailIsValidated')
        await this.commandBus.execute(
          new UpdateUsersProviderCommand(
            existingWithEmailUsersProvider[EDbEntityFields.id],
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
          ),
        );
        return {
          [EDbEntityFields.id]:
            existingWithEmailUsersProvider[EUsersProviderFields.userLocalId],
        };
      }

      // should add to non-locals -> local does not exist
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
      await this.commandBus.execute(
        new UpdateUsersProviderCommand(
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
        ),
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
    if (existingWithProviderIdUsersProvider && !user.isLocalProvider()) {
      await this.commandBus.execute(
        new UpdateUsersProviderCommand(
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
        ),
      );
      return {
        [EDbEntityFields.id]:
          existingWithProviderIdUsersProvider[EUsersProviderFields.userLocalId],
      };
    }

    // sub || provider email <- does not exist <- adds to existing
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

    // non-local does not exist -> will add
    return this.commandBus.execute(new CreateUserCommand(user));
  }
}

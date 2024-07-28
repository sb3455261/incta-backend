import { Injectable } from '@nestjs/common';
import { User } from 'apps/users/src/domain/user';
import {
  EDbEntityFields,
  EProvider,
  EProviderFields,
  EUserFields,
  EUsersProviderFields,
  IUsersProvider,
} from '@app/shared';
import { UserRepository } from '../../../application/ports/user-abstract.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private prisma: PrismaService) {
    super();
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      include: { [EUserFields.providers]: true },
    });
  }

  async #create(user: User, newUsersProvider: IUsersProvider) {
    const newUser = await this.prisma.user.create({
      data: {
        [EDbEntityFields.id]: user[EDbEntityFields.id],
        [EUserFields.providers]: {
          create: [newUsersProvider as Required<IUsersProvider>],
        },
      },
    });
    return { [EDbEntityFields.id]: newUser[EDbEntityFields.id] };
  }

  async create(user: User): Promise<Omit<User, EUserFields.providers>> {
    const provider = await this.prisma.provider.findFirstOrThrow({
      where: {
        [EProviderFields.name]:
          user.providers[0][EUsersProviderFields.providerName],
      },
    });
    const newUsersProvider = user.providers[0];
    newUsersProvider[EUsersProviderFields.providerName] = undefined;
    newUsersProvider[EUsersProviderFields.providerLocalId] =
      provider[EDbEntityFields.id];

    if (provider[EProviderFields.name] === EProvider.local) {
      return this.#create(user, newUsersProvider);
    }

    const existingWithEmailUsersProvider =
      await this.prisma.usersProvider.findFirst({
        where: {
          [EUsersProviderFields.email]:
            newUsersProvider[EUsersProviderFields.email],
          [EUsersProviderFields.providerLocalId]: provider[EDbEntityFields.id],
        },
      });
    if (existingWithEmailUsersProvider) {
      await this.prisma.usersProvider.update({
        where: {
          [EDbEntityFields.id]:
            existingWithEmailUsersProvider[EDbEntityFields.id],
        },
        data: {
          [EUsersProviderFields.name]:
            newUsersProvider[EUsersProviderFields.name],
          [EUsersProviderFields.surname]:
            newUsersProvider[EUsersProviderFields.surname],
          [EUsersProviderFields.password]:
            newUsersProvider[EUsersProviderFields.password],
          [EUsersProviderFields.avatar]:
            newUsersProvider[EUsersProviderFields.avatar],
        },
      });
      return {
        [EDbEntityFields.id]:
          existingWithEmailUsersProvider[EUsersProviderFields.userLocalId],
      };
    }

    const existingWithProviderIdUsersProvider =
      await this.prisma.usersProvider.findFirst({
        where: {
          [EUsersProviderFields.sub]:
            newUsersProvider[EUsersProviderFields.sub],
          [EUsersProviderFields.providerLocalId]: provider[EDbEntityFields.id],
        },
      });
    if (existingWithProviderIdUsersProvider) {
      await this.prisma.usersProvider.update({
        where: {
          [EDbEntityFields.id]:
            existingWithProviderIdUsersProvider[EDbEntityFields.id],
        },
        data: {
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
      });
      return {
        [EDbEntityFields.id]:
          existingWithProviderIdUsersProvider[EUsersProviderFields.userLocalId],
      };
    }

    return this.#create(user, newUsersProvider);
  }
}

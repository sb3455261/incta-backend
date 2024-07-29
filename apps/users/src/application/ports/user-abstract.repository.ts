import {
  EDbEntityFields,
  EProvider,
  EUserFields,
  IUser,
  IUsersProvider,
} from '@app/shared';
import { User } from '../../domain/user';

export abstract class UserRepository {
  abstract findUsersProvider(
    where: Partial<IUsersProvider>,
  ): Promise<IUsersProvider | null>;
  abstract findAll(): Promise<IUser[]>;
  abstract create(userData: User): Promise<Omit<IUser, EUserFields.providers>>;
  abstract createUsersProvider(
    userId: string,
    providerData: Omit<IUsersProvider, EDbEntityFields.id>,
  ): Promise<void>;
  abstract update(id: string, data: Partial<IUsersProvider>): Promise<void>;
  abstract findProvider(
    providerName: EProvider,
  ): Promise<{ [EDbEntityFields.id]: string }>;
}

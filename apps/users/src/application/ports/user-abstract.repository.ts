import { EUserFields } from '@app/shared';
import { User } from '../../domain/user';

export abstract class UserRepository {
  abstract findAll(): Promise<User[]>;
  abstract create(userData: User): Promise<Omit<User, EUserFields.providers>>;
}

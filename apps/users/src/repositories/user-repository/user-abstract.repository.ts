import { User } from '@app/shared';

export abstract class UserRepository {
  abstract findAll(): Promise<User[]>;
  // abstract findByEmail(email: string): Promise<User | null>;
  // abstract create(user: Omit<User, 'id'>): Promise<User>;
}

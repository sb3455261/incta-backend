import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IUser } from '@app/shared';
import { GetAllUsersQuery } from './get-all-users.query';
import { UserRepository } from '../ports/user-abstract.repository';

@QueryHandler(GetAllUsersQuery)
export class GetAllUsersQueryHandler
  implements IQueryHandler<GetAllUsersQuery, IUser[]>
{
  constructor(private readonly repository: UserRepository) {}

  async execute(query: GetAllUsersQuery): Promise<IUser[]> {
    return this.repository.findAll();
  }
}

import { Injectable } from '@nestjs/common';
import { User } from '@app/shared';
import { UserRepository } from './user-abstract.repository';
import { PrismaService } from '../prisma-repository/prisma.service';

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private prisma: PrismaService) {
    super();
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }
}

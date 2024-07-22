import { Module } from '@nestjs/common';
import { AppConfigModule } from '@app/shared';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from './repositories/prisma-repository/prisma.module';
import { PrismaService } from './repositories/prisma-repository/prisma.service';
import { UserRepository } from './repositories/user-repository/user-abstract.repository';
import { PrismaUserRepository } from './repositories/user-repository/user-prisma.repository';

@Module({
  imports: [AppConfigModule, PrismaModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaService,
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}

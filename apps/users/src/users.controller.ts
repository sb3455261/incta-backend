import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { EUsersRoutes } from '@app/shared';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: EUsersRoutes.getusers })
  async getHello() {
    return this.usersService.getHello();
  }
}

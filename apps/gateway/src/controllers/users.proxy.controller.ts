import { appConfig, EGatewayRoutes, EUsersRoutes } from '@app/shared';
import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller()
export class UsersProxyController {
  constructor(
    @Inject(appConfig().USERS_MICROSERVICE_NAME)
    private usersClient: ClientProxy,
  ) {}

  @Get(EGatewayRoutes.users)
  async getUsers() {
    return this.usersClient.send({ cmd: EUsersRoutes.getusers }, {});
  }
}

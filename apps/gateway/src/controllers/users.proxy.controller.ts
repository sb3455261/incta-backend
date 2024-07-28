import {
  appConfig,
  EGatewayRoutes,
  EUsersRoutes,
  UsersProviderDto,
} from '@app/shared';
import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { UsersErrorInterceptor } from '../interceptors/users-errors.interceptor';

@Controller()
@UseInterceptors(UsersErrorInterceptor)
export class UsersProxyController {
  constructor(
    @Inject(appConfig().USERS_MICROSERVICE_NAME)
    private usersClient: ClientProxy,
  ) {}

  @Get(EGatewayRoutes.users)
  async findAllUsers() {
    return this.usersClient.send({ cmd: EUsersRoutes.findAllUsers }, {});
  }

  @Post(EGatewayRoutes.users)
  async createUser(@Body() userProviderData: UsersProviderDto) {
    return this.usersClient.send(
      { cmd: EUsersRoutes.createUser },
      userProviderData,
    );
  }
}

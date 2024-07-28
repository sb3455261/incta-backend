import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import {
  EUsersProviderFields,
  EUsersRoutes,
  UsersProviderDto,
} from '@app/shared';
import { UsersService } from '../../application/users.service';
import { CreateUsersProviderCommand } from '../../application/commands/create-users-provider.command';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: EUsersRoutes.findAllUsers })
  async findAll() {
    try {
      return await this.usersService.findAll();
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @MessagePattern({ cmd: EUsersRoutes.createUser })
  async create(@Payload() userProviderData: UsersProviderDto) {
    try {
      const {
        [EUsersProviderFields.providerName]: providerName,
        [EUsersProviderFields.sub]: sub,
        [EUsersProviderFields.email]: email,
        [EUsersProviderFields.login]: login,
        [EUsersProviderFields.name]: name,
        [EUsersProviderFields.surname]: surname,
        [EUsersProviderFields.password]: password,
        [EUsersProviderFields.avatar]: avatar,
        [EUsersProviderFields.emailIsValidated]: emailIsValidated,
      } = userProviderData;
      const createUsersProviderCommand = new CreateUsersProviderCommand(
        providerName,
        sub,
        email,
        login,
        name,
        surname,
        password,
        avatar,
        emailIsValidated,
      );
      return await this.usersService.create(createUsersProviderCommand);
    } catch (error) {
      throw new RpcException(error);
    }
  }
}

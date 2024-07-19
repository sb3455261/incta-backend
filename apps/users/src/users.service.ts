import { appConfig as _appConfig, TAppConfig } from '@app/shared';
import { BadGatewayException, Inject, Injectable } from '@nestjs/common';
import { UserRepository } from './repositories/user-repository/user-abstract.repository';

@Injectable()
export class UsersService {
  constructor(
    @Inject(_appConfig.KEY)
    private readonly appConfig: TAppConfig,
    private readonly repository: UserRepository,
  ) {}

  async getHello(): Promise<string> {
    try {
      return `Hello World 1! is running on port ${this.appConfig.USERS_MICROSERVICE_PORT} && findAllUsersReturns ${JSON.stringify(await this.repository.findAll())}`;
    } catch (error) {
      console.error(error.message);
      throw new BadGatewayException();
    }
  }
}

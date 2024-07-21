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
      return `<div>
        <div>Hello World 1! is running on port ${this.appConfig.USERS_MICROSERVICE_PORT}</div>
        <div>&& USERS_DATABASE_URL is set to: ...${this.appConfig.USERS_DATABASE_URL.slice(-30)}</div>
        <div>&& findAllUsersReturns ${JSON.stringify(await this.repository.findAll())}</div>
    <div>`;
    } catch (error) {
      console.error(error.message);
      throw new BadGatewayException();
    }
  }
}

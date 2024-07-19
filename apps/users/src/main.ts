import { NestFactory } from '@nestjs/core';
import { appConfig as _appConfig } from '@app/shared';
import { UsersModule } from './users.module';

(async function () {
  const appConfig = _appConfig();
  const usersApp = await NestFactory.create(UsersModule);
  usersApp.setGlobalPrefix(appConfig.APP_API_PREFIX);
  await usersApp.listen(appConfig.USERS_MICROSERVICE_PORT).then(() => {
    console.debug(
      `
        Users microservice is running on port ${appConfig.USERS_MICROSERVICE_PORT}\n
        DB connection is: ${process.env.USERS_DATABASE_URL}
      `,
    );
  });
})();

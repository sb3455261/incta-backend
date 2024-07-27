import { NestFactory } from '@nestjs/core';
import { appConfig as _appConfig } from '@app/shared';
import { GatewayModule } from './gateway.module';

(async function bootstrap() {
  const appConfig = _appConfig();
  const gatewayApp = await NestFactory.create(GatewayModule);
  gatewayApp.setGlobalPrefix(appConfig.APP_API_PREFIX);
  await gatewayApp.listen(appConfig.GATEWAY_MICROSERVICE_PORT).then(() => {
    console.debug(
      `
        Gateway microservice is running on port ${appConfig.GATEWAY_MICROSERVICE_PORT}
      `,
    );
  });
})();

import { NestFactory } from '@nestjs/core';
import { appConfig as _appConfig } from '@app/shared';
import * as cookieParser from 'cookie-parser';
import { GatewayModule } from './gateway.module';
import { swagger } from './swagger';

(async function bootstrap() {
  const config = _appConfig();
  const gatewayApp = await NestFactory.create(GatewayModule);
  gatewayApp.use(cookieParser());
  gatewayApp.setGlobalPrefix(config.APP_API_PREFIX);
  swagger(gatewayApp);
  await gatewayApp.listen(config.GATEWAY_MICROSERVICE_PORT).then(() => {
    console.debug(
      `
        Gateway microservice is running on port ${config.GATEWAY_MICROSERVICE_PORT}
      `,
    );
  });
})();

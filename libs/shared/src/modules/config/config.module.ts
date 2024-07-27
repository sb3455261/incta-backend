import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType, registerAs } from '@nestjs/config';
import * as Joi from 'joi';
import * as dotenv from 'dotenv';
import { expand } from 'dotenv-expand';

expand(dotenv.config({ path: './.env' }));

export const APP_CONFIG_NAME = 'appConfig';

export const appConfig = registerAs(APP_CONFIG_NAME, () => {
  const configValues = {
    APP_API_PREFIX: process.env.APP_API_PREFIX,

    GATEWAY_MICROSERVICE_PORT: +process.env.GATEWAY_MICROSERVICE_PORT,

    USERS_MICROSERVICE_NAME: process.env.USERS_MICROSERVICE_NAME,
    USERS_MICROSERVICE_HOST: process.env.USERS_MICROSERVICE_HOST,
    USERS_MICROSERVICE_PORT: +process.env.USERS_MICROSERVICE_PORT,
    USERS_DATABASE_URL: process.env.USERS_DATABASE_URL,
  };

  const schema = Joi.object({
    APP_API_PREFIX: Joi.string(),
    GATEWAY_MICROSERVICE_PORT: Joi.number(),
    USERS_MICROSERVICE_NAME: Joi.string(),
    USERS_MICROSERVICE_HOST: Joi.string(),
    USERS_MICROSERVICE_PORT: Joi.number(),
    USERS_DATABASE_URL: Joi.string(),
  });

  const { error } = schema.validate(configValues, { abortEarly: false });

  if (error) {
    try {
      throw new Error(error.message || 'Config validation error');
    } catch (_error) {
      console.error(
        `\nApp ENV variables validation failed\n${_error.message
          .split('.')
          .map((text: string) => text.trim())
          .join('\n')}`,
      );
      process.exit(1);
    }
  }
  return Object.freeze(configValues);
});

export type TAppConfig = ConfigType<typeof appConfig>;

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
      isGlobal: true,
    }),
  ],
})
export class AppConfigModule {}

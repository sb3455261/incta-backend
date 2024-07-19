import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType, registerAs } from '@nestjs/config';
import * as Joi from 'joi';
import * as dotenv from 'dotenv';
import { expand } from 'dotenv-expand';

if (process.env.NODE_ENV === 'development') {
  expand(dotenv.config({ path: './.env' }));
}

export const APP_CONFIG_NAME = 'appConfig';

export const appConfig = registerAs(APP_CONFIG_NAME, () => {
  const usersValues = {
    APP_API_PREFIX: process.env.APP_API_PREFIX,
    USERS_MICROSERVICE_PORT: +process.env.USERS_MICROSERVICE_PORT,
  };
  const { error } = Joi.object({
    APP_API_PREFIX: Joi.string().required(),
    USERS_MICROSERVICE_PORT: Joi.number().required(),
  }).validate({ ...usersValues }, { abortEarly: false });
  if (error) {
    try {
      throw new Error(error.message);
    } catch (_error) {
      console.error(
        `\nApp ENV variables validation failed\n${_error.message
          .split('.')
          .map((text: string) => text.trim())
          .join('\n')}`,
      );
      process.exit(0);
    }
  }
  return Object.freeze({ ...usersValues });
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

import { ValidationPipe, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export const UsersDataValidationPipe = new ValidationPipe({
  transform: true,
  transformOptions: { enableImplicitConversion: true },
  whitelist: true,
  forbidNonWhitelisted: true,
  exceptionFactory: (errors) => {
    const messages = errors
      .map((error) => Object.values(error.constraints))
      .flat();
    return new RpcException({
      message: messages.join(', '),
      code: HttpStatus.BAD_REQUEST,
    });
  },
});

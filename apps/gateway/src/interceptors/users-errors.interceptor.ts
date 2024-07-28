import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable()
export class UsersErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error.code === HttpStatus.BAD_REQUEST) {
          return throwError(
            () => new HttpException(error.message, HttpStatus.BAD_REQUEST),
          );
        }
        if (error.name === 'PrismaClientKnownRequestError') {
          return throwError(
            () => new HttpException('Entity exists.', HttpStatus.CONFLICT),
          );
        }

        return throwError(
          () =>
            new HttpException(
              'Internal server error',
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
        );
      }),
    );
  }
}

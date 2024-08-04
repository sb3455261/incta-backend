import { ApiProperty } from '@nestjs/swagger';
import { Messages } from '../constants/messages.constants';

export class SuccessResponseDto {
  @ApiProperty({
    description: Messages.DESC_SUCCESS_INDICATOR,
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: Messages.DESC_SUCCESS_MESSAGE,
    example: Messages.SUCCESS_OPERATION,
  })
  message: string;
}

export class EmailVerificationResponseDto {
  @ApiProperty({
    description: Messages.DESC_REDIRECT_URL,
    example: Messages.DESC_URL_SAMPLE,
  })
  redirect: string;
}

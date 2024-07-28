import {
  IsString,
  IsEmail,
  MinLength,
  IsEnum,
  IsNotEmpty,
  ValidateIf,
  Matches,
  MaxLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { EProvider, EUsersProviderFields } from '../../types/user/user.type';
import { appConfig as _appConfig } from '../../modules/config/config.module';

const appConfig = _appConfig();

export class UsersProviderDto {
  @IsNotEmpty()
  @IsEnum(EProvider)
  public readonly [EUsersProviderFields.providerName]: EProvider;

  @ValidateIf(
    (_this) =>
      _this[EUsersProviderFields.providerName] === EProvider.github ||
      _this[EUsersProviderFields.providerName] === EProvider.google,
  )
  @IsString()
  @MaxLength(200)
  public readonly [EUsersProviderFields.sub]?: string;

  @IsEmail()
  public readonly [EUsersProviderFields.email]: string;

  @ValidateIf(
    (_this) => _this[EUsersProviderFields.providerName] === EProvider.local,
  )
  @IsString()
  @MinLength(appConfig.USERNAME_MIN_LENGHT)
  @MaxLength(appConfig.USERNAME_MAX_LENGHT)
  @Matches(new RegExp(`^${appConfig.USERNAME_ALLOWED_SYMBOLS}+$`), {
    message:
      'Login can only contain letters, numbers, underscores, and hyphens',
  })
  public readonly [EUsersProviderFields.login]: string;

  @IsOptional()
  @IsString()
  @MaxLength(appConfig.USERNAME_MAX_LENGHT)
  public readonly [EUsersProviderFields.name]?: string;

  @IsOptional()
  @IsString()
  @MaxLength(appConfig.USERNAME_MAX_LENGHT)
  public readonly [EUsersProviderFields.surname]?: string;

  @IsString()
  @ValidateIf(
    (_this) => _this[EUsersProviderFields.providerName] === EProvider.local,
  )
  @MinLength(appConfig.USERPASSWORD_MIN_LENGHT)
  @MaxLength(appConfig.USERPASSWORD_MAX_LENGHT)
  @Matches(new RegExp(`^${appConfig.USERPASSWORD_ALLOWED_SYMBOLS}.*$`), {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  public readonly [EUsersProviderFields.password]: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  public readonly [EUsersProviderFields.avatar]?: string;

  @IsBoolean()
  get [EUsersProviderFields.emailIsValidated](): boolean {
    return this[EUsersProviderFields.providerName] !== EProvider.local;
  }
}

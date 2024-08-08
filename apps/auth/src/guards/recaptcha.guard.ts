import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import fetch from 'node-fetch';
import { Request } from 'express';

@Injectable()
export class RecaptchaGuard implements CanActivate {
  private readonly recaptchaSecretKey = '6LdmBSIqAAAAAF_wsrEy9iEv2eoBqAbxBMsaFheL';

  private readonly recaptchaVerifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

  // 6LdmBSIqAAAAAAMRgrSwT6AGzORV9yapA8-EkNKC - site-key
  //
  // 6LdmBSIqAAAAAF_wsrEy9iEv2eoBqAbxBMsaFheL - secret-key

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const { recaptchaToken } = request.body;

    if (!recaptchaToken) {
      throw new UnauthorizedException('reCAPTCHA token is missing');
    }

    const isValid = await this.validateRecaptchaToken(recaptchaToken);
    if (!isValid) {
      throw new UnauthorizedException('Invalid reCAPTCHA token');
    }

    return true;
  }

  private async validateRecaptchaToken(token: string): Promise<boolean> {
    const params = new URLSearchParams({
      secret: this.recaptchaSecretKey,
      response: token,
    });

    try {
      const response = await fetch(this.recaptchaVerifyUrl, {
        method: 'POST',
        body: params,
      });
      const data = await response.json();

      if (!data.success) {
        throw new UnauthorizedException('Failed reCAPTCHA validation');
      }

      if (!data.score || data.score < 0.5) {
        throw new UnauthorizedException('reCAPTCHA validation failed');
      }

      if (data.action !== 'submit') {
        throw new UnauthorizedException(`Invalid reCAPTCHA action: ${data.action}`);
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException('Failed to validate reCAPTCHA token');
    }
  }
}

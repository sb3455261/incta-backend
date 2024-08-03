import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailNotifierService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(options: { to: string, subject: string, template: string, context: any }) {
    if (!options.to) {
      throw new Error('Email recipient "to" is required');
    }
    if (!options.subject) {
      throw new Error('Email subject is required');
    }
    if (!options.template) {
      throw new Error('Email template is required');
    }

    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: options.context,
      });
    } catch (e) {
      console.error('Failed to send email:', e);
      throw new Error('Failed to send email')
    }
  }
}

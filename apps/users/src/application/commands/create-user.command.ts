import { EDbEntityFields } from '@app/shared';
import { randomUUID } from 'crypto';

export class CreateUserCommand {
  constructor() {
    this[EDbEntityFields.id] = randomUUID();
  }
}

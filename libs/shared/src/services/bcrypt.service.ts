import { Injectable } from '@nestjs/common';
import { compare, genSalt, hash } from 'bcrypt';

@Injectable()
export abstract class HashPasswordService {
  abstract hash(data: string | Buffer): Promise<string>;
  abstract compare(data: string | Buffer, encrypted: string): Promise<boolean>;
}

@Injectable()
export class BcryptService implements HashPasswordService {
  async hash(rawPassword: string | Buffer): Promise<string> {
    return hash(rawPassword, await genSalt());
  }

  compare(rawPassword: string | Buffer, encrypted: string): Promise<boolean> {
    return compare(rawPassword, encrypted);
  }
}

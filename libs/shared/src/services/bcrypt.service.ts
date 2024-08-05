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
    console.debug('BcryptService 1', rawPassword, 'rawPassword');
    const _hash = await hash(rawPassword, await genSalt());
    console.debug('BcryptService 2', _hash, '_hash');
    return _hash
  }

  async compare(
    rawPassword: string | Buffer,
    encrypted: string,
  ): Promise<boolean> {
    return compare(rawPassword, encrypted);
  }
}

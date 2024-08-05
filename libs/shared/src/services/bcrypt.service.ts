import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export abstract class HashPasswordService {
  abstract hash(data: string | Buffer): Promise<string>;
  abstract compare(data: string | Buffer, encrypted: string): Promise<boolean>;
}

@Injectable()
export class BcryptService implements HashPasswordService {
  async hash(rawPassword: string | Buffer): Promise<string> {
    try {
        console.debug('hash 1')
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(rawPassword, salt, 1000, 64, 'sha512').toString('hex');
        console.debug('hash 2', `${salt}:${hash}`)
        return `${salt}:${hash}`;
    } catch(error) {
        console.debug(error, 'error')
        return 'HASH'
    }
  }

  async compare(
    rawPassword: string | Buffer,
    encrypted: string,
  ): Promise<boolean> {
    const [salt, storedHash] = encrypted.split(':');
    const suppliedHash = crypto.pbkdf2Sync(rawPassword, salt, 1000, 64, 'sha512').toString('hex');
    return storedHash === suppliedHash;
  }
}

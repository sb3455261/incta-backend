import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export abstract class HashPasswordService {
  abstract hash(data: string | Buffer): Promise<string>;
  abstract compare(data: string | Buffer, encrypted: string): Promise<boolean>;
}

@Injectable()
export class BcryptService implements HashPasswordService {
  async hash(rawPassword: string | Buffer): Promise<string> {
    try {
        const salt = bcrypt.genSaltSync()
        const hash = bcrypt.hashSync(rawPassword, salt);
        console.debug(hash, 'hash')
        return hash
    } catch(error) {
        console.debug(error, 'error')
        return 'HASH'
    }
  }

  async compare(
    rawPassword: string | Buffer,
    encrypted: string,
  ): Promise<boolean> {
    return bcrypt.compareSync(rawPassword, encrypted);
  }
}

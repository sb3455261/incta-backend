import { Injectable } from '@nestjs/common';
//import { compare, genSalt, hash } from 'bcrypt';
import bcrypt from "bcrypt"

@Injectable()
export abstract class HashPasswordService {
  abstract hash(data: string | Buffer): Promise<string>;
  abstract compare(data: string | Buffer, encrypted: string): Promise<boolean>;
}

@Injectable()
export class BcryptService implements HashPasswordService {
  async hash(rawPassword: string | Buffer): Promise<string> {
    try {
        console.debug('BcryptService 1', rawPassword, 'rawPassword');
        console.log(bcrypt, 'bcrypt')
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(rawPassword, salt);
        console.debug('BcryptService 2', hash, '_hash');
        return hash
    } catch(error) {
        console.log(error)
        console.debug('BcryptService 2');
    }
    return 'BcryptService HASH'
  }

  async compare(
    rawPassword: string | Buffer,
    encrypted: string,
  ): Promise<boolean> {
    return await bcrypt.compare(rawPassword, encrypted);
  }
}

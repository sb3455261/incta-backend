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
        //const _hash = await hash(rawPassword, await genSalt());
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(rawPassword, salt);
        const hash2 = await bcrypt.hash(rawPassword, 10)
        console.debug('BcryptService 2', hash, '_hash');
        console.debug('BcryptService 3', hash2, 'hash2');
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

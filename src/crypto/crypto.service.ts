import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { AppConfig } from '../config/configuration';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;

/**
 * Encrypts and decrypts sensitive text (SSH private keys) at rest using
 * AES-256-GCM. The key is derived once from SSH_KEY_ENCRYPTION_SECRET, a
 * 64-char hex string (32 bytes) supplied via environment configuration.
 */
@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(configService: ConfigService<AppConfig, true>) {
    const secret = configService.get('sshKeyEncryptionSecret', { infer: true });
    this.key = Buffer.from(secret, 'hex');
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  decrypt(ciphertext: string): string {
    const payload = Buffer.from(ciphertext, 'base64');
    const iv = payload.subarray(0, IV_LENGTH_BYTES);
    const authTag = payload.subarray(IV_LENGTH_BYTES, IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES);
    const encrypted = payload.subarray(IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES);

    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }
}

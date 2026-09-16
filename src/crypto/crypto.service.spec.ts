import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { AppConfig } from '../config/configuration';
import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let cryptoService: CryptoService;

  beforeEach(() => {
    const secret = randomBytes(32).toString('hex');
    const configService = {
      get: () => secret,
    } as unknown as ConfigService<AppConfig, true>;

    cryptoService = new CryptoService(configService);
  });

  it('encrypts and decrypts back to the original plaintext', () => {
    const plaintext =
      '-----BEGIN OPENSSH PRIVATE KEY-----\nabc123\n-----END OPENSSH PRIVATE KEY-----';

    const ciphertext = cryptoService.encrypt(plaintext);
    expect(ciphertext).not.toContain('BEGIN OPENSSH');

    const decrypted = cryptoService.decrypt(ciphertext);
    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertext for the same plaintext each time (random IV)', () => {
    const plaintext = 'super-secret-key-material';

    const first = cryptoService.encrypt(plaintext);
    const second = cryptoService.encrypt(plaintext);

    expect(first).not.toBe(second);
  });

  it('throws when the ciphertext has been tampered with', () => {
    const ciphertext = cryptoService.encrypt('some private key');
    const tampered = ciphertext.slice(0, -4) + 'abcd';

    expect(() => cryptoService.decrypt(tampered)).toThrow();
  });
});

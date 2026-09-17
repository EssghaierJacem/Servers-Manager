import { utils as ssh2Utils } from 'ssh2';
import { generateSshKeypair } from './ssh-keypair.util';

describe('generateSshKeypair', () => {
  it('generates a private key ssh2 can parse and a matching public key', () => {
    const { privateKey, publicKey } = generateSshKeypair('servers-manager');

    const parsed = ssh2Utils.parseKey(privateKey);
    expect(parsed).not.toBeInstanceOf(Error);
    if (parsed instanceof Error) throw parsed;

    expect(parsed.type).toBe('ssh-ed25519');

    const [keyType, base64FromKey, comment] = publicKey.split(' ');
    expect(keyType).toBe('ssh-ed25519');
    expect(comment).toBe('servers-manager');
    expect(parsed.getPublicSSH().toString('base64')).toBe(base64FromKey);
  });

  it('produces a private key in OpenSSH PEM format', () => {
    const { privateKey } = generateSshKeypair('host-1');

    expect(privateKey).toMatch(/^-----BEGIN OPENSSH PRIVATE KEY-----\n/);
    expect(privateKey.trim()).toMatch(/-----END OPENSSH PRIVATE KEY-----$/);
  });

  it('embeds the given comment in the public key line', () => {
    const { publicKey } = generateSshKeypair('prod-web-01');

    expect(publicKey.endsWith(' prod-web-01')).toBe(true);
  });

  it('generates a different keypair on every call', () => {
    const first = generateSshKeypair('a');
    const second = generateSshKeypair('a');

    expect(first.privateKey).not.toBe(second.privateKey);
    expect(first.publicKey).not.toBe(second.publicKey);
  });
});

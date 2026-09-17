import { createPrivateKey, createPublicKey, generateKeyPairSync, randomBytes } from 'crypto';

export interface GeneratedSshKeypair {
  privateKey: string;
  publicKey: string;
}

const ED25519_SPKI_DER_LENGTH = 44;
const ED25519_PKCS8_DER_LENGTH = 48;
const ED25519_RAW_KEY_LENGTH = 32;
const OPENSSH_PRIVATE_KEY_LINE_WIDTH = 70;

function uint32BE(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value, 0);
  return buffer;
}

function sshString(value: Buffer): Buffer {
  return Buffer.concat([uint32BE(value.length), value]);
}

/**
 * Builds an "openssh-key-v1" unencrypted private key blob (the format
 * `ssh-keygen` produces) for an ed25519 key. Node's `crypto` module can
 * generate ed25519 keys but only export them as PKCS8/SPKI PEM, which ssh2
 * (and therefore node-ssh) cannot parse for ed25519 - so the OpenSSH wire
 * format is built by hand here. Verified against both `ssh-keygen -y` and
 * ssh2's own key parser during development.
 */
function buildOpenSshPrivateKey(
  publicKeyRaw: Buffer,
  privateKeySeed: Buffer,
  comment: string,
): string {
  const keyType = Buffer.from('ssh-ed25519');
  const publicKeyBlob = Buffer.concat([sshString(keyType), sshString(publicKeyRaw)]);
  const privateAndPublicKey = Buffer.concat([privateKeySeed, publicKeyRaw]);

  const checkInt = randomBytes(4);
  let privateSection = Buffer.concat([
    checkInt,
    checkInt,
    sshString(keyType),
    sshString(publicKeyRaw),
    sshString(privateAndPublicKey),
    sshString(Buffer.from(comment)),
  ]);

  const paddingLength = (8 - (privateSection.length % 8)) % 8;
  const padding = Buffer.from(Array.from({ length: paddingLength }, (_, i) => i + 1));
  privateSection = Buffer.concat([privateSection, padding]);

  const body = Buffer.concat([
    Buffer.from('openssh-key-v1\0'),
    sshString(Buffer.from('none')), // cipher name: unencrypted
    sshString(Buffer.from('none')), // KDF name
    sshString(Buffer.alloc(0)), // KDF options
    uint32BE(1), // number of keys
    sshString(publicKeyBlob),
    sshString(privateSection),
  ]);

  const base64 = body.toString('base64');
  const lines: string[] = [];
  for (let i = 0; i < base64.length; i += OPENSSH_PRIVATE_KEY_LINE_WIDTH) {
    lines.push(base64.slice(i, i + OPENSSH_PRIVATE_KEY_LINE_WIDTH));
  }

  return `-----BEGIN OPENSSH PRIVATE KEY-----\n${lines.join('\n')}\n-----END OPENSSH PRIVATE KEY-----\n`;
}

function buildOpenSshPublicKey(publicKeyRaw: Buffer, comment: string): string {
  const keyType = Buffer.from('ssh-ed25519');
  const blob = Buffer.concat([sshString(keyType), sshString(publicKeyRaw)]);
  return `ssh-ed25519 ${blob.toString('base64')} ${comment}`;
}

/**
 * Generates a fresh ed25519 keypair server-side. The private key never
 * leaves this function's caller other than to be encrypted at rest
 * immediately (see HostsService.create) - it is never returned by any API
 * response.
 */
export function generateSshKeypair(comment: string): GeneratedSshKeypair {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const publicKeyDer = createPublicKey(publicKey).export({ type: 'spki', format: 'der' });
  const privateKeyDer = createPrivateKey(privateKey).export({ type: 'pkcs8', format: 'der' });

  if (
    publicKeyDer.length !== ED25519_SPKI_DER_LENGTH ||
    privateKeyDer.length !== ED25519_PKCS8_DER_LENGTH
  ) {
    throw new Error('Unexpected ed25519 key encoding from the platform crypto library');
  }

  const publicKeyRaw = publicKeyDer.subarray(publicKeyDer.length - ED25519_RAW_KEY_LENGTH);
  const privateKeySeed = privateKeyDer.subarray(privateKeyDer.length - ED25519_RAW_KEY_LENGTH);

  return {
    privateKey: buildOpenSshPrivateKey(publicKeyRaw, privateKeySeed, comment),
    publicKey: buildOpenSshPublicKey(publicKeyRaw, comment),
  };
}

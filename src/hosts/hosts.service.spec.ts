import { ConfigService } from '@nestjs/config';
import { utils as ssh2Utils } from 'ssh2';
import { CryptoService } from '../crypto/crypto.service';
import { AppConfig } from '../config/configuration';
import { HostsService } from './hosts.service';
import { HostProvider, HostStatus } from './entities/host.entity';

describe('HostsService', () => {
  let hostRepository: { create: jest.Mock; save: jest.Mock };
  let cryptoService: CryptoService;
  let service: HostsService;

  beforeEach(() => {
    hostRepository = {
      create: jest.fn((input) => input),
      save: jest.fn((input) => Promise.resolve({ ...input, id: 'host-1', createdAt: new Date() })),
    };

    const configService = {
      get: () => '0'.repeat(64),
    } as unknown as ConfigService<AppConfig, true>;
    cryptoService = new CryptoService(configService);

    service = new HostsService(hostRepository as never, {} as never, cryptoService, {
      add: jest.fn(),
    } as never);
  });

  describe('create', () => {
    it('creates the host as pending_setup with a real keypair and no verification timestamp yet', async () => {
      const host = await service.create('org-1', {
        name: 'prod-web-01',
        provider: HostProvider.OTHER,
        ip_address: '203.0.113.10',
        ssh_user: 'ubuntu',
      });

      expect(host.status).toBe(HostStatus.PENDING_SETUP);
      expect(host.setupVerifiedAt).toBeNull();
      expect(host.sshPublicKey.startsWith('ssh-ed25519 ')).toBe(true);
    });

    it('encrypts a private key that actually pairs with the returned public key', async () => {
      const host = await service.create('org-1', {
        name: 'prod-web-01',
        provider: HostProvider.OTHER,
        ip_address: '203.0.113.10',
        ssh_user: 'ubuntu',
      });

      const decryptedPrivateKey = cryptoService.decrypt(host.sshKeyEncrypted);
      const parsedPrivateKey = ssh2Utils.parseKey(decryptedPrivateKey);
      if (parsedPrivateKey instanceof Error) throw parsedPrivateKey;

      const [, publicKeyBase64] = host.sshPublicKey.split(' ');
      expect(parsedPrivateKey.getPublicSSH().toString('base64')).toBe(publicKeyBase64);
    });

    it('never puts the private key anywhere in the returned host other than the encrypted field', async () => {
      const host = await service.create('org-1', {
        name: 'prod-web-01',
        provider: HostProvider.OTHER,
        ip_address: '203.0.113.10',
        ssh_user: 'ubuntu',
      });

      const serialized = JSON.stringify(host);
      expect(serialized).not.toContain('PRIVATE KEY');
    });
  });
});

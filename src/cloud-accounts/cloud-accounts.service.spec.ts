import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from '../crypto/crypto.service';
import { AppConfig } from '../config/configuration';
import { CloudAccountsService } from './cloud-accounts.service';
import { CloudAccount, CloudProvider } from './entities/cloud-account.entity';

describe('CloudAccountsService', () => {
  let cloudAccountRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let cryptoService: CryptoService;
  let service: CloudAccountsService;

  beforeEach(() => {
    cloudAccountRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((input) => input),
      save: jest.fn((input) => Promise.resolve({ ...input, id: 'account-1' })),
      remove: jest.fn(),
    };

    const configService = {
      get: () => '0'.repeat(64),
    } as unknown as ConfigService<AppConfig, true>;
    cryptoService = new CryptoService(configService);

    service = new CloudAccountsService(cloudAccountRepository as never, cryptoService);
  });

  describe('findAllForOrg', () => {
    it('returns every known provider, marking only the connected ones', async () => {
      const awsAccount = {
        id: 'account-1',
        provider: CloudProvider.AWS,
        label: 'Prod AWS',
        connectedAt: new Date('2026-01-01'),
      } as CloudAccount;
      cloudAccountRepository.find.mockResolvedValue([awsAccount]);

      const result = await service.findAllForOrg('org-1');

      expect(result).toHaveLength(Object.values(CloudProvider).length);
      const aws = result.find((r) => r.provider === CloudProvider.AWS);
      expect(aws).toMatchObject({ connected: true, label: 'Prod AWS' });
      const vercel = result.find((r) => r.provider === CloudProvider.VERCEL);
      expect(vercel).toMatchObject({ connected: false, label: null, id: null });
    });
  });

  describe('connect', () => {
    it('encrypts the API key before storing it', async () => {
      cloudAccountRepository.findOne.mockResolvedValue(null);

      const result = await service.connect('org-1', {
        provider: CloudProvider.VERCEL,
        label: 'My Vercel',
        apiKey: 'super-secret-token',
      });

      expect(result.connected).toBe(true);
      const saved = cloudAccountRepository.save.mock.calls[0][0];
      expect(saved.apiKeyEncrypted).not.toBe('super-secret-token');
    });

    it('reconnecting an existing provider updates the same row instead of creating a new one', async () => {
      const existing = {
        id: 'account-1',
        orgId: 'org-1',
        provider: CloudProvider.RENDER,
        label: 'Old label',
        apiKeyEncrypted: 'old',
        connectedAt: new Date('2020-01-01'),
      } as CloudAccount;
      cloudAccountRepository.findOne.mockResolvedValue(existing);

      await service.connect('org-1', {
        provider: CloudProvider.RENDER,
        label: 'New label',
        apiKey: 'new-token',
      });

      expect(cloudAccountRepository.create).not.toHaveBeenCalled();
      expect(cloudAccountRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'account-1', label: 'New label' }),
      );
    });
  });

  describe('disconnect', () => {
    it('removes the account when it belongs to the org', async () => {
      const account = { id: 'account-1', orgId: 'org-1' } as CloudAccount;
      cloudAccountRepository.findOne.mockResolvedValue(account);

      await service.disconnect('org-1', 'account-1');

      expect(cloudAccountRepository.remove).toHaveBeenCalledWith(account);
    });

    it('throws when the account does not exist for this org', async () => {
      cloudAccountRepository.findOne.mockResolvedValue(null);

      await expect(service.disconnect('org-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });
});

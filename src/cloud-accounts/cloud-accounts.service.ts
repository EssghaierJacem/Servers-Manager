import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptoService } from '../crypto/crypto.service';
import { ConnectCloudAccountDto } from './dto/connect-cloud-account.dto';
import { CloudAccountResponseDto } from './dto/cloud-account-response.dto';
import { toCloudAccountResponseDto } from './cloud-accounts.mapper';
import { CloudAccount, CloudProvider } from './entities/cloud-account.entity';

@Injectable()
export class CloudAccountsService {
  constructor(
    @InjectRepository(CloudAccount)
    private readonly cloudAccountRepository: Repository<CloudAccount>,
    private readonly cryptoService: CryptoService,
  ) {}

  /** Every known provider, merged with whichever ones this org has connected. */
  async findAllForOrg(orgId: string): Promise<CloudAccountResponseDto[]> {
    const connected = await this.cloudAccountRepository.find({ where: { orgId } });
    const byProvider = new Map(connected.map((account) => [account.provider, account]));

    return Object.values(CloudProvider).map((provider) =>
      toCloudAccountResponseDto(provider, byProvider.get(provider) ?? null),
    );
  }

  async connect(orgId: string, dto: ConnectCloudAccountDto): Promise<CloudAccountResponseDto> {
    const existing = await this.cloudAccountRepository.findOne({
      where: { orgId, provider: dto.provider },
    });

    const apiKeyEncrypted = this.cryptoService.encrypt(dto.apiKey);

    const account = existing
      ? await this.cloudAccountRepository.save({
          ...existing,
          label: dto.label,
          apiKeyEncrypted,
          connectedAt: new Date(),
        })
      : await this.cloudAccountRepository.save(
          this.cloudAccountRepository.create({
            orgId,
            provider: dto.provider,
            label: dto.label,
            apiKeyEncrypted,
            connectedAt: new Date(),
          }),
        );

    return toCloudAccountResponseDto(dto.provider, account);
  }

  async disconnect(orgId: string, id: string): Promise<void> {
    const account = await this.cloudAccountRepository.findOne({ where: { id, orgId } });
    if (!account) {
      throw new NotFoundException('Cloud account not found');
    }
    await this.cloudAccountRepository.remove(account);
  }
}

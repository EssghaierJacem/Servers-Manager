import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DEFAULT_ORGANIZATION_NAME, Organization } from './entities/organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  /**
   * Returns the single default organization, creating it on first run.
   * Multi-tenancy is out of scope for this phase but org_id is threaded
   * through every table now to avoid a painful migration later.
   */
  async getOrCreateDefault(): Promise<Organization> {
    const existing = await this.organizationRepository.findOne({
      where: { name: DEFAULT_ORGANIZATION_NAME },
    });
    if (existing) {
      return existing;
    }

    const created = this.organizationRepository.create({ name: DEFAULT_ORGANIZATION_NAME });
    return this.organizationRepository.save(created);
  }
}

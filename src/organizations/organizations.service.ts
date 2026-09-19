import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  create(name: string): Promise<Organization> {
    const organization = this.organizationRepository.create({ name });
    return this.organizationRepository.save(organization);
  }

  findById(id: string): Promise<Organization | null> {
    return this.organizationRepository.findOne({ where: { id } });
  }
}

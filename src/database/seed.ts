import 'dotenv/config';
import {
  DEFAULT_ORGANIZATION_NAME,
  Organization,
} from '../organizations/entities/organization.entity';
import { AppDataSource } from '../config/data-source';

async function seed(): Promise<void> {
  const dataSource = await AppDataSource.initialize();
  const repository = dataSource.getRepository(Organization);

  const existing = await repository.findOne({ where: { name: DEFAULT_ORGANIZATION_NAME } });
  if (existing) {
    console.log(`Default organization already exists (id: ${existing.id})`);
  } else {
    const organization = await repository.save(
      repository.create({ name: DEFAULT_ORGANIZATION_NAME }),
    );
    console.log(`Created default organization (id: ${organization.id})`);
  }

  await dataSource.destroy();
}

seed().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});

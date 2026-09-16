import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeploymentSnapshot } from './entities/deployment-snapshot.entity';
import { DeploymentSnapshotsService } from './deployment-snapshots.service';

@Module({
  imports: [TypeOrmModule.forFeature([DeploymentSnapshot])],
  providers: [DeploymentSnapshotsService],
  exports: [DeploymentSnapshotsService],
})
export class DeploymentSnapshotsModule {}

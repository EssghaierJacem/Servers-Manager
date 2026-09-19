import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudAccount } from './entities/cloud-account.entity';
import { CloudAccountsService } from './cloud-accounts.service';
import { CloudAccountsController } from './cloud-accounts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CloudAccount])],
  providers: [CloudAccountsService],
  controllers: [CloudAccountsController],
})
export class CloudAccountsModule {}

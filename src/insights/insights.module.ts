import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Host } from '../hosts/entities/host.entity';
import { Domain } from '../domains/entities/domain.entity';
import { Service } from '../services/entities/service.entity';
import { InsightState } from './entities/insight-state.entity';
import { InsightsService } from './insights.service';
import { InsightsController } from './insights.controller';
import { InsightsScheduler } from './insights.scheduler';
import { InsightsProcessor } from './insights.processor';
import { AlertsModule } from '../alerts/alerts.module';
import { INSIGHTS_QUEUE } from './insights.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Host, Domain, Service, InsightState]),
    AlertsModule,
    BullModule.registerQueue({
      name: INSIGHTS_QUEUE,
      defaultJobOptions: { removeOnComplete: true, removeOnFail: 50 },
    }),
  ],
  controllers: [InsightsController],
  providers: [InsightsService, InsightsScheduler, InsightsProcessor],
  exports: [InsightsService],
})
export class InsightsModule {}

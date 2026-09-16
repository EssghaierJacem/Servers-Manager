import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InsightsService } from './insights.service';
import { INSIGHTS_QUEUE } from './insights.constants';

@Processor(INSIGHTS_QUEUE)
export class InsightsProcessor extends WorkerHost {
  private readonly logger = new Logger(InsightsProcessor.name);

  constructor(private readonly insightsService: InsightsService) {
    super();
  }

  async process(_job: Job): Promise<void> {
    this.logger.debug('Running daily insights check (idle hosts, orphaned domains/hosts)');
    await this.insightsService.runDailyCheck();
  }
}

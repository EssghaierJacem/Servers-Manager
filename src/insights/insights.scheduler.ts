import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { upsertRepeatableTick } from '../common/bullmq/repeatable-tick.util';
import {
  INSIGHTS_INTERVAL_MS,
  INSIGHTS_QUEUE,
  INSIGHTS_REPEATABLE_JOB_ID,
  INSIGHTS_TICK_JOB,
} from './insights.constants';

/**
 * Its own daily repeatable job on its own queue - this is an aggregate
 * query across all hosts/domains, not a per-entity check, so it doesn't
 * piggyback on the host-health or domain-check schedules.
 */
@Injectable()
export class InsightsScheduler implements OnModuleInit {
  private readonly logger = new Logger(InsightsScheduler.name);

  constructor(@InjectQueue(INSIGHTS_QUEUE) private readonly insightsQueue: Queue) {}

  async onModuleInit(): Promise<void> {
    await upsertRepeatableTick(
      this.insightsQueue,
      INSIGHTS_REPEATABLE_JOB_ID,
      INSIGHTS_INTERVAL_MS,
      INSIGHTS_TICK_JOB,
    );

    this.logger.log(`Scheduled daily insights check every ${INSIGHTS_INTERVAL_MS}ms`);
  }
}

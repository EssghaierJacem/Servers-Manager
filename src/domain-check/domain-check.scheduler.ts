import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { AppConfig } from '../config/configuration';
import { upsertRepeatableTick } from '../common/bullmq/repeatable-tick.util';
import { DomainCheckJobData } from './domain-check-job.interface';
import {
  DOMAIN_CHECK_QUEUE,
  DOMAIN_CHECK_REPEATABLE_JOB_ID,
  DOMAIN_CHECK_TICK_JOB,
} from './domain-check.constants';

/**
 * Registers a repeatable "tick" job on its own queue/schedule, separate
 * from the host health-check queue - domains change slowly (every 6h by
 * default) compared to host health (every 2min).
 */
@Injectable()
export class DomainCheckScheduler implements OnModuleInit {
  private readonly logger = new Logger(DomainCheckScheduler.name);

  constructor(
    @InjectQueue(DOMAIN_CHECK_QUEUE)
    private readonly domainCheckQueue: Queue<DomainCheckJobData>,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async onModuleInit(): Promise<void> {
    const intervalMs = this.configService.get('domainCheck', { infer: true }).intervalMs;

    await upsertRepeatableTick(
      this.domainCheckQueue,
      DOMAIN_CHECK_REPEATABLE_JOB_ID,
      intervalMs,
      DOMAIN_CHECK_TICK_JOB,
    );

    this.logger.log(`Scheduled recurring domain checks every ${intervalMs}ms`);
  }
}

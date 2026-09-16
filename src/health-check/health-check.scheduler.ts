import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { AppConfig } from '../config/configuration';
import { HealthCheckJobData } from './health-check-job.interface';
import {
  HEALTH_CHECK_QUEUE,
  HEALTH_CHECK_REPEATABLE_JOB_ID,
  HEALTH_CHECK_TICK_JOB,
} from './health-check.constants';

/**
 * Registers a repeatable "tick" job. On each tick the processor fans out
 * one check-host job per registered host, so a slow/unreachable host never
 * blocks the others (see HealthCheckProcessor.enqueueCheckForAllHosts).
 */
@Injectable()
export class HealthCheckScheduler implements OnModuleInit {
  private readonly logger = new Logger(HealthCheckScheduler.name);

  constructor(
    @InjectQueue(HEALTH_CHECK_QUEUE)
    private readonly healthCheckQueue: Queue<HealthCheckJobData>,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async onModuleInit(): Promise<void> {
    const intervalMs = this.configService.get('healthCheck', { infer: true }).intervalMs;

    await this.healthCheckQueue.upsertJobScheduler(
      HEALTH_CHECK_REPEATABLE_JOB_ID,
      { every: intervalMs },
      { name: HEALTH_CHECK_TICK_JOB },
    );

    this.logger.log(`Scheduled recurring health checks every ${intervalMs}ms`);
  }
}

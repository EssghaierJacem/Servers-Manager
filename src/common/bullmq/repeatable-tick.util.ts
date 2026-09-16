import { Queue } from 'bullmq';

/**
 * Registers (or updates) a repeatable "tick" job on a queue. Both the host
 * health-check queue and the domain-check queue use this same tick+fan-out
 * pattern: a tick fires on a schedule, and the processor fans out one job
 * per entity so a single slow/unreachable entity never blocks the others.
 */
export async function upsertRepeatableTick(
  queue: Queue,
  schedulerId: string,
  intervalMs: number,
  tickJobName: string,
): Promise<void> {
  await queue.upsertJobScheduler(schedulerId, { every: intervalMs }, { name: tickJobName });
}

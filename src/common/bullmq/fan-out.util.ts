import { JobsOptions, Queue } from 'bullmq';

const DEFAULT_JOB_OPTIONS: JobsOptions = { removeOnComplete: true, removeOnFail: 50 };

/**
 * Enqueues one job per entity id. Used by the tick handler of both the
 * host health-check and domain-check processors to fan a single scheduled
 * tick out into independently-processed per-entity jobs.
 */
export async function enqueuePerEntityJobs<TData extends object>(
  queue: Queue<TData>,
  jobName: string,
  ids: string[],
  buildData: (id: string) => TData,
): Promise<void> {
  // bullmq's Queue.add() types `name` against a conditional type derived from
  // TData that can't be resolved inside a generic helper like this one; the
  // runtime call is exactly what a direct `queue.add(jobName, data, opts)`
  // call site would do, so this cast is safe.
  const untypedQueue = queue as unknown as {
    add: (name: string, data: TData, opts: unknown) => Promise<unknown>;
  };
  await Promise.all(ids.map((id) => untypedQueue.add(jobName, buildData(id), DEFAULT_JOB_OPTIONS)));
}

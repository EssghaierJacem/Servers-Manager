import { Logger } from '@nestjs/common';
import { ServiceStatus } from './entities/service.entity';

const logger = new Logger('ContainerStatusClassifier');

/**
 * Classifies a container into a ServiceStatus from Docker's own reported
 * `docker ps` status string. Order matters: "Restarting" is checked before
 * "Up" so a container that Docker is actively restarting is never mistaken
 * for a healthy running one.
 */
export function classifyContainerStatus(rawStatus: string): ServiceStatus {
  const status = rawStatus ?? '';

  if (status.includes('Restarting')) {
    return ServiceStatus.CRASH_LOOP;
  }

  if (status.includes('Up')) {
    return status.includes('(unhealthy)') ? ServiceStatus.UNHEALTHY : ServiceStatus.RUNNING;
  }

  if (status.includes('Exited')) {
    return ServiceStatus.STOPPED;
  }

  logger.warn(`Unrecognized container status, classifying as unknown: "${rawStatus}"`);
  return ServiceStatus.UNKNOWN;
}

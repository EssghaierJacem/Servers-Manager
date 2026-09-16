import { HealthCheckStatus } from '../hosts/entities/health-check-status.enum';
import { SshCommandResult } from '../ssh/ssh.service';
import { isDockerMissing } from '../common/utils/docker.util';

export interface HealthCheckOutcome {
  status: HealthCheckStatus;
  rawOutput: Record<string, unknown>;
}

/**
 * Maps the outcome of an SSH connection attempt and its commands to a
 * health status. A host with Docker not installed is still healthy as long
 * as the SSH session itself and the uptime command succeeded.
 */
export function mapSshFailureToOutcome(error: unknown): HealthCheckOutcome {
  const message = error instanceof Error ? error.message : String(error);
  return {
    status: HealthCheckStatus.UNREACHABLE,
    rawOutput: { error: message },
  };
}

export function mapCommandResultsToOutcome(results: SshCommandResult[]): HealthCheckOutcome {
  const [uptimeResult, dockerResult] = results;

  const rawOutput: Record<string, unknown> = {
    uptime: {
      stdout: uptimeResult.stdout,
      stderr: uptimeResult.stderr,
      exit_code: uptimeResult.exitCode,
    },
    docker_ps: {
      stdout: dockerResult.stdout,
      stderr: dockerResult.stderr,
      exit_code: dockerResult.exitCode,
    },
  };

  const uptimeFailed = uptimeResult.exitCode !== 0;
  if (uptimeFailed) {
    return { status: HealthCheckStatus.DEGRADED, rawOutput };
  }

  const dockerNotInstalled = isDockerMissing(dockerResult);
  const dockerFailedUnexpectedly = dockerResult.exitCode !== 0 && !dockerNotInstalled;
  if (dockerFailedUnexpectedly) {
    return { status: HealthCheckStatus.DEGRADED, rawOutput };
  }

  return { status: HealthCheckStatus.HEALTHY, rawOutput };
}

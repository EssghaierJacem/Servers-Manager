import { HealthCheckStatus } from '../hosts/entities/health-check-status.enum';
import { SshCommandResult } from '../ssh/ssh.service';
import { isDockerMissing } from '../common/utils/docker.util';

export interface HealthCheckOutcome {
  status: HealthCheckStatus;
  rawOutput: Record<string, unknown>;
}

/**
 * ssh2 tags every connection error with a `level`. Only an auth rejection
 * (the SSH session negotiated fine, but every offered key was refused) sets
 * 'client-authentication' - everything else (refused/timed out/DNS/handshake
 * failures) is a network-level problem, same bucket as today.
 */
function isAuthenticationFailure(error: unknown): boolean {
  return (error as { level?: string } | null)?.level === 'client-authentication';
}

/**
 * Maps the outcome of a failed SSH connection attempt to a health status. A
 * host with Docker not installed is still healthy as long as the SSH
 * session itself and the uptime command succeeded (see
 * mapCommandResultsToOutcome) - this function only handles the connection
 * itself never being established or authenticated.
 *
 * `setupVerifiedAt` distinguishes "this host has never completed setup" from
 * "this host worked before and something has since changed": an auth
 * rejection on a host that has never been verified means the bootstrap
 * command likely hasn't been run yet, so it stays pending_setup rather than
 * reading as a scary permanent failure. The same rejection on a
 * previously-verified host means the key was removed or the user changed -
 * a real, reportable problem - so it's unreachable.
 */
export function mapSshFailureToOutcome(
  error: unknown,
  setupVerifiedAt: Date | null,
): HealthCheckOutcome {
  const message = error instanceof Error ? error.message : String(error);

  if (isAuthenticationFailure(error)) {
    if (setupVerifiedAt === null) {
      return {
        status: HealthCheckStatus.PENDING_SETUP,
        rawOutput: { error: message, reason: 'key_not_installed' },
      };
    }
    return {
      status: HealthCheckStatus.UNREACHABLE,
      rawOutput: { error: message, reason: 'auth_revoked' },
    };
  }

  return {
    status: HealthCheckStatus.UNREACHABLE,
    rawOutput: { error: message, reason: 'network_unreachable' },
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

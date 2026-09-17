import { HealthCheckStatus } from '../hosts/entities/health-check-status.enum';
import { SshCommandResult } from '../ssh/ssh.service';
import { mapCommandResultsToOutcome, mapSshFailureToOutcome } from './health-check-status-mapper';

function result(overrides: Partial<SshCommandResult>): SshCommandResult {
  return { command: 'cmd', stdout: '', stderr: '', exitCode: 0, ...overrides };
}

function authFailure(message = 'All configured authentication methods failed'): Error {
  const error = new Error(message) as Error & { level: string };
  error.level = 'client-authentication';
  return error;
}

function networkFailure(message: string, level?: string): Error {
  const error = new Error(message) as Error & { level?: string };
  if (level) error.level = level;
  return error;
}

describe('health-check-status-mapper', () => {
  describe('mapSshFailureToOutcome', () => {
    it('maps a connection-refused error to unreachable regardless of setup history', () => {
      const outcome = mapSshFailureToOutcome(networkFailure('ECONNREFUSED', 'client-socket'), null);

      expect(outcome.status).toBe(HealthCheckStatus.UNREACHABLE);
      expect(outcome.rawOutput.error).toBe('ECONNREFUSED');
      expect(outcome.rawOutput.reason).toBe('network_unreachable');
    });

    it('maps a handshake timeout to unreachable', () => {
      const outcome = mapSshFailureToOutcome(
        networkFailure('Timed out while waiting for handshake', 'client-timeout'),
        new Date(),
      );

      expect(outcome.status).toBe(HealthCheckStatus.UNREACHABLE);
      expect(outcome.rawOutput.reason).toBe('network_unreachable');
    });

    it('maps a generic error with no level to unreachable', () => {
      const outcome = mapSshFailureToOutcome(new Error('boom'), null);

      expect(outcome.status).toBe(HealthCheckStatus.UNREACHABLE);
    });

    it('maps an auth rejection on a never-verified host to pending_setup with a clear reason', () => {
      const outcome = mapSshFailureToOutcome(authFailure(), null);

      expect(outcome.status).toBe(HealthCheckStatus.PENDING_SETUP);
      expect(outcome.rawOutput.reason).toBe('key_not_installed');
    });

    it('maps an auth rejection on a previously-verified host to unreachable, not pending_setup', () => {
      const outcome = mapSshFailureToOutcome(authFailure(), new Date('2024-01-01T00:00:00Z'));

      expect(outcome.status).toBe(HealthCheckStatus.UNREACHABLE);
      expect(outcome.rawOutput.reason).toBe('auth_revoked');
    });
  });

  describe('mapCommandResultsToOutcome', () => {
    it('is healthy when uptime and docker ps both succeed', () => {
      const outcome = mapCommandResultsToOutcome([
        result({ stdout: 'up 3 days', exitCode: 0 }),
        result({ stdout: '{"Names":"web"}', exitCode: 0 }),
      ]);

      expect(outcome.status).toBe(HealthCheckStatus.HEALTHY);
    });

    it('is healthy when docker is not installed but uptime succeeds', () => {
      const outcome = mapCommandResultsToOutcome([
        result({ stdout: 'up 3 days', exitCode: 0 }),
        result({ stderr: 'bash: docker: command not found', exitCode: 127 }),
      ]);

      expect(outcome.status).toBe(HealthCheckStatus.HEALTHY);
    });

    it('is degraded when uptime fails', () => {
      const outcome = mapCommandResultsToOutcome([
        result({ stderr: 'permission denied', exitCode: 1 }),
        result({ stdout: '', exitCode: 0 }),
      ]);

      expect(outcome.status).toBe(HealthCheckStatus.DEGRADED);
    });

    it('is degraded when docker ps fails for a reason other than being missing', () => {
      const outcome = mapCommandResultsToOutcome([
        result({ stdout: 'up 3 days', exitCode: 0 }),
        result({ stderr: 'Cannot connect to the Docker daemon', exitCode: 1 }),
      ]);

      expect(outcome.status).toBe(HealthCheckStatus.DEGRADED);
    });
  });
});

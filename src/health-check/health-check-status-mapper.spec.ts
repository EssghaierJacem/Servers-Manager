import { HealthCheckStatus } from '../hosts/entities/health-check-status.enum';
import { SshCommandResult } from '../ssh/ssh.service';
import { mapCommandResultsToOutcome, mapSshFailureToOutcome } from './health-check-status-mapper';

function result(overrides: Partial<SshCommandResult>): SshCommandResult {
  return { command: 'cmd', stdout: '', stderr: '', exitCode: 0, ...overrides };
}

describe('health-check-status-mapper', () => {
  describe('mapSshFailureToOutcome', () => {
    it('maps any connection error to unreachable', () => {
      const outcome = mapSshFailureToOutcome(new Error('ECONNREFUSED'));

      expect(outcome.status).toBe(HealthCheckStatus.UNREACHABLE);
      expect(outcome.rawOutput.error).toBe('ECONNREFUSED');
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

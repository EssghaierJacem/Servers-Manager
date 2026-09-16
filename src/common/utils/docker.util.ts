import { SshCommandResult } from '../../ssh/ssh.service';
import { DOCKER_NOT_INSTALLED_MARKERS } from '../constants/ssh.constant';

/**
 * True when a `docker ...` command failed because Docker itself isn't
 * installed on the host, as opposed to Docker being installed but the
 * command failing for some other reason. Shared by the host health
 * classifier (docker missing is not itself a failure) and the service
 * sync (docker missing means "no containers to sync", not an error).
 */
export function isDockerMissing(result: SshCommandResult): boolean {
  if (result.exitCode === 0) {
    return false;
  }
  const combined = `${result.stdout} ${result.stderr}`.toLowerCase();
  return DOCKER_NOT_INSTALLED_MARKERS.some((marker) => combined.includes(marker));
}

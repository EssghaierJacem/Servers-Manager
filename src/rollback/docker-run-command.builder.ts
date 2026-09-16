import { DeploymentConfigBlob } from '../deployment-snapshots/deployment-config-blob.interface';

/**
 * Single-quotes a value for a POSIX shell, escaping embedded single quotes
 * by closing the quote, inserting an escaped quote, and reopening it. Env
 * var values captured from `docker inspect` are untrusted-ish (they came
 * from whatever the original container was configured with) and get
 * re-interpolated into a shell command here, so this is a real command
 * injection boundary, not just cosmetic quoting.
 */
export function shellEscape(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/**
 * Builds the `docker run` invocation that recreates a container from a
 * DeploymentConfigBlob. Only the fields DeploymentConfigBlob captures are
 * applied - see that interface's doc comment for the documented
 * limitation (no volumes, networks, resource limits, etc.).
 */
export function buildDockerRunCommand(config: DeploymentConfigBlob, imageTag: string): string {
  const parts = ['docker', 'run', '-d', '--name', shellEscape(config.containerName)];

  for (const portBinding of config.portBindings) {
    parts.push('-p', shellEscape(portBinding));
  }

  for (const envVar of config.env) {
    parts.push('-e', shellEscape(envVar));
  }

  if (config.restartPolicy) {
    parts.push('--restart', shellEscape(config.restartPolicy));
  }

  parts.push(shellEscape(imageTag));

  return parts.join(' ');
}

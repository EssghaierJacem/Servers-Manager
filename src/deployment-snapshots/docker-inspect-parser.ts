import { DeploymentConfigBlob } from './deployment-config-blob.interface';

interface DockerInspectPortBinding {
  HostIp?: string;
  HostPort?: string;
}

interface DockerInspectContainer {
  Name?: string;
  Config?: {
    Env?: string[];
  };
  HostConfig?: {
    PortBindings?: Record<string, DockerInspectPortBinding[] | null>;
    RestartPolicy?: {
      Name?: string;
    };
  };
}

/**
 * `docker inspect <id>` prints a single-element JSON array. Only the
 * fields DeploymentConfigBlob needs are pulled out - see the interface's
 * doc comment for what's deliberately not captured.
 */
export function parseDockerInspectOutput(stdout: string): DeploymentConfigBlob | null {
  let parsed: DockerInspectContainer[];
  try {
    parsed = JSON.parse(stdout) as DockerInspectContainer[];
  } catch {
    return null;
  }

  const container = parsed[0];
  if (!container) {
    return null;
  }

  const containerName = (container.Name ?? '').replace(/^\//, '');
  const env = container.Config?.Env ?? [];
  const restartPolicy = container.HostConfig?.RestartPolicy?.Name ?? '';
  const portBindings = flattenPortBindings(container.HostConfig?.PortBindings ?? {});

  if (!containerName) {
    return null;
  }

  return { containerName, env, portBindings, restartPolicy };
}

/**
 * Turns docker inspect's `HostConfig.PortBindings` map (keyed by
 * "containerPort/proto") into `docker run -p` style strings, e.g.
 * "8080:80/tcp". Container ports with no host binding are skipped - they
 * were exposed but not published, so there's nothing to `-p` for them.
 */
function flattenPortBindings(
  portBindings: Record<string, DockerInspectPortBinding[] | null>,
): string[] {
  const flattened: string[] = [];

  for (const [containerPort, bindings] of Object.entries(portBindings)) {
    for (const binding of bindings ?? []) {
      if (binding.HostPort) {
        flattened.push(`${binding.HostPort}:${containerPort}`);
      }
    }
  }

  return flattened;
}

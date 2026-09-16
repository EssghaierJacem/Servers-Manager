/**
 * The captured runtime config for a container, cheap to get from
 * `docker inspect` and enough to recreate the container on rollback. This
 * is a deliberate, documented limitation: volumes, networks, resource
 * limits, and any other flag outside this set are not captured, so a
 * rollback is not guaranteed to reproduce the exact original `docker run`
 * invocation if the container was started with flags outside this set.
 */
export interface DeploymentConfigBlob {
  containerName: string;
  env: string[];
  portBindings: string[];
  restartPolicy: string;
}

import { DeploymentSnapshot } from './entities/deployment-snapshot.entity';
import { DeploymentSnapshotResponseDto } from './dto/deployment-snapshot-response.dto';

/**
 * Deliberately omits config_blob - it's encrypted container config that
 * may include secret env vars, and is never returned by any API response.
 */
export function toDeploymentSnapshotResponseDto(
  snapshot: DeploymentSnapshot,
): DeploymentSnapshotResponseDto {
  return {
    id: snapshot.id,
    image_tag: snapshot.imageTag,
    deployed_at: snapshot.deployedAt,
    deployed_by: snapshot.deployedById,
    is_current: snapshot.isCurrent,
    created_at: snapshot.createdAt,
  };
}

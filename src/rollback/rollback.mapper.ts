import { RollbackEvent } from './entities/rollback-event.entity';
import { RollbackEventResponseDto } from './dto/rollback-event-response.dto';

export function toRollbackEventResponseDto(event: RollbackEvent): RollbackEventResponseDto {
  return {
    id: event.id,
    service_id: event.serviceId,
    from_snapshot_id: event.fromSnapshotId,
    to_snapshot_id: event.toSnapshotId,
    triggered_by: event.triggeredById,
    status: event.status,
    log_output: event.logOutput,
    initiated_at: event.initiatedAt,
    completed_at: event.completedAt,
  };
}

import { AlertEntityType } from './entities/alert-rule.entity';
import { buildAlertMessage } from './alert-message.builder';

describe('buildAlertMessage', () => {
  it('includes the previous and new status when both are given', () => {
    const message = buildAlertMessage({
      entityType: AlertEntityType.HOST,
      entityId: 'host-1',
      condition: 'host_status_transitioned_to:unreachable',
      previousStatus: 'healthy',
      newStatus: 'unreachable',
    });

    expect(message).toBe(
      '[host] host_status_transitioned_to:unreachable (entity host-1): healthy -> unreachable',
    );
  });

  it('omits the status arrow when no statuses are given', () => {
    const message = buildAlertMessage({
      entityType: AlertEntityType.SYSTEM,
      entityId: 'host-1',
      condition: 'system:idle_host_detected',
    });

    expect(message).toBe('[system] system:idle_host_detected (entity host-1)');
  });
});

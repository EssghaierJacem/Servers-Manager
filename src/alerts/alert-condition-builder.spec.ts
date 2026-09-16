import { AlertEntityType } from './entities/alert-rule.entity';
import { buildTransitionCondition } from './alert-condition-builder';

describe('buildTransitionCondition', () => {
  it('builds the host condition string', () => {
    expect(buildTransitionCondition(AlertEntityType.HOST, 'unreachable')).toBe(
      'host_status_transitioned_to:unreachable',
    );
  });

  it('builds the ssl_certificate condition string', () => {
    expect(buildTransitionCondition(AlertEntityType.SSL_CERTIFICATE, 'expiring_soon')).toBe(
      'ssl_status_transitioned_to:expiring_soon',
    );
  });

  it('builds the service condition string', () => {
    expect(buildTransitionCondition(AlertEntityType.SERVICE, 'crash_loop')).toBe(
      'service_status_transitioned_to:crash_loop',
    );
  });

  it('builds rollback_event:failed only when the new status is failed', () => {
    expect(buildTransitionCondition(AlertEntityType.ROLLBACK_EVENT, 'failed')).toBe(
      'rollback_event:failed',
    );
    expect(buildTransitionCondition(AlertEntityType.ROLLBACK_EVENT, 'succeeded')).toBeNull();
  });

  it('returns null for entity types with no transition condition scheme', () => {
    expect(buildTransitionCondition(AlertEntityType.DOMAIN, 'not_resolving')).toBeNull();
    expect(buildTransitionCondition(AlertEntityType.SYSTEM, 'anything')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import {
  ALERT_CONDITION_OPTIONS,
  describeAlertCondition,
  findAlertConditionOption,
} from './alertConditions';

describe('alertConditions', () => {
  it('has a unique, non-empty value for every option', () => {
    const values = ALERT_CONDITION_OPTIONS.map((o) => o.value);
    expect(values.length).toBeGreaterThan(0);
    expect(new Set(values).size).toBe(values.length);
  });

  it('finds a known condition by value', () => {
    const option = findAlertConditionOption('host_status_transitioned_to:unreachable');
    expect(option?.label).toBe('A host becomes unreachable');
    expect(option?.entityType).toBe('host');
  });

  it('returns undefined for an unknown condition', () => {
    expect(findAlertConditionOption('not-a-real-condition')).toBeUndefined();
  });

  it('describeAlertCondition falls back to the raw value when unrecognized', () => {
    expect(describeAlertCondition('some:future-condition')).toBe('some:future-condition');
  });

  it('describeAlertCondition returns the human label for a known condition', () => {
    expect(describeAlertCondition('rollback_event:failed')).toBe('A rollback fails');
  });
});

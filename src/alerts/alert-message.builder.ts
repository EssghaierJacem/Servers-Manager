import { AlertEntityType } from './entities/alert-rule.entity';

export interface BuildAlertMessageInput {
  entityType: AlertEntityType;
  entityId: string;
  condition: string;
  previousStatus?: string;
  newStatus?: string;
}

export function buildAlertMessage(input: BuildAlertMessageInput): string {
  const base = `[${input.entityType}] ${input.condition} (entity ${input.entityId})`;

  if (input.previousStatus !== undefined && input.newStatus !== undefined) {
    return `${base}: ${input.previousStatus} -> ${input.newStatus}`;
  }

  return base;
}

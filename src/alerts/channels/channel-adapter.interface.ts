export interface ChannelSendResult {
  success: boolean;
  error?: string;
}

/**
 * One adapter per AlertChannel. Adding a new channel means adding a new
 * adapter and a case in AlertEvaluationService.getAdapter() - it never
 * touches the rule-matching/cooldown/dispatch logic.
 */
export interface ChannelAdapter {
  send(message: string, config: Record<string, unknown>): Promise<ChannelSendResult>;
}

import { Injectable, Logger } from '@nestjs/common';
import { ChannelAdapter, ChannelSendResult } from './channel-adapter.interface';

const SLACK_WEBHOOK_TIMEOUT_MS = 8000;
const ERROR_BODY_PREVIEW_LENGTH = 500;

/**
 * Delivers a message via a Slack Incoming Webhook - a plain HTTPS POST,
 * no SDK needed. Never throws: every failure mode (missing config,
 * timeout, non-2xx response, network error) resolves to
 * `{ success: false, error }` so the caller can log it and move on.
 */
@Injectable()
export class SlackChannelAdapter implements ChannelAdapter {
  private readonly logger = new Logger(SlackChannelAdapter.name);

  async send(message: string, config: Record<string, unknown>): Promise<ChannelSendResult> {
    const webhookUrl = config.webhook_url;
    if (typeof webhookUrl !== 'string' || webhookUrl.trim() === '') {
      return { success: false, error: 'Slack channel config is missing "webhook_url"' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SLACK_WEBHOOK_TIMEOUT_MS);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        return {
          success: false,
          error: `Slack webhook returned ${response.status}: ${body.slice(0, ERROR_BODY_PREVIEW_LENGTH)}`,
        };
      }

      return { success: true };
    } catch (error) {
      const message =
        (error as Error).name === 'AbortError'
          ? `Slack webhook POST timed out after ${SLACK_WEBHOOK_TIMEOUT_MS}ms`
          : describeFetchError(error as Error);
      this.logger.warn(`Slack delivery failed: ${message}`);
      return { success: false, error: message };
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Node's fetch wraps every network-level failure (DNS resolution, TLS,
 * connection refused, ...) in a generic "fetch failed" TypeError with the
 * real reason nested in `.cause`. Surface that nested reason so a failed
 * AlertLog entry is actually diagnosable instead of just saying "fetch failed".
 */
function describeFetchError(error: Error): string {
  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause instanceof Error) {
    return `${error.message}: ${cause.message}`;
  }
  return error.message;
}

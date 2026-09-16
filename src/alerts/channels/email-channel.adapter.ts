import { Injectable, Logger } from '@nestjs/common';
import { ChannelAdapter, ChannelSendResult } from './channel-adapter.interface';

const NOT_CONFIGURED_MESSAGE =
  'Email channel not yet configured (no SMTP infrastructure in this phase)';

/**
 * Stub adapter: the interface is fully implemented so email is a drop-in
 * addition once SMTP credentials exist, but no delivery is attempted here
 * - every send is recorded as a failed AlertLog with a clear reason
 * rather than silently pretending to succeed.
 */
@Injectable()
export class EmailChannelAdapter implements ChannelAdapter {
  private readonly logger = new Logger(EmailChannelAdapter.name);

  send(_message: string, _config: Record<string, unknown>): Promise<ChannelSendResult> {
    this.logger.warn(NOT_CONFIGURED_MESSAGE);
    return Promise.resolve({ success: false, error: NOT_CONFIGURED_MESSAGE });
  }
}

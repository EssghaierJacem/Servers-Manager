import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertRule } from './entities/alert-rule.entity';
import { AlertLog } from './entities/alert-log.entity';
import { AlertsService } from './alerts.service';
import { AlertEvaluationService } from './alert-evaluation.service';
import { AlertRulesController } from './alert-rules.controller';
import { AlertLogsController } from './alert-logs.controller';
import { SlackChannelAdapter } from './channels/slack-channel.adapter';
import { EmailChannelAdapter } from './channels/email-channel.adapter';

@Module({
  imports: [TypeOrmModule.forFeature([AlertRule, AlertLog])],
  controllers: [AlertRulesController, AlertLogsController],
  providers: [AlertsService, AlertEvaluationService, SlackChannelAdapter, EmailChannelAdapter],
  exports: [AlertEvaluationService],
})
export class AlertsModule {}

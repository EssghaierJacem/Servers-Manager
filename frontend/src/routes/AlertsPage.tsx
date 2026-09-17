import { FormEvent, useState } from 'react';
import {
  useAlertRules,
  useCreateAlertRule,
  useDeleteAlertRule,
  useSetAlertRuleEnabled,
} from '../hooks/useAlertRules';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Switch } from '../components/Switch';
import { SelectField, TextField } from '../components/TextField';
import { BellIcon, SlackIcon } from '../components/icons';
import { ALERT_CONDITION_OPTIONS, findAlertConditionOption } from '../lib/alertConditions';
import { ApiError } from '../lib/apiClient';
import { formatTimestamp } from '../lib/formatters';

const DEFAULT_COOLDOWN_MINUTES = 30;

export function AlertsPage() {
  const alertRules = useAlertRules();
  const createRule = useCreateAlertRule();
  const setEnabled = useSetAlertRuleEnabled();
  const deleteRule = useDeleteAlertRule();

  const [webhookUrl, setWebhookUrl] = useState('');
  const [conditionValue, setConditionValue] = useState(ALERT_CONDITION_OPTIONS[0].value);
  const [cooldownMinutes, setCooldownMinutes] = useState(String(DEFAULT_COOLDOWN_MINUTES));
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);

    if (!/^https:\/\/hooks\.slack\.com\/services\//.test(webhookUrl.trim())) {
      setError(
        'Enter a valid Slack incoming webhook URL (starts with https://hooks.slack.com/services/).',
      );
      return;
    }
    const cooldown = Number(cooldownMinutes);
    if (!Number.isInteger(cooldown) || cooldown < 1) {
      setError('Cooldown must be a whole number of minutes, 1 or more.');
      return;
    }

    const option = findAlertConditionOption(conditionValue);
    if (!option) return;

    try {
      await createRule.mutateAsync({
        name: option.label,
        entity_type: option.entityType,
        condition: option.value,
        channel: 'slack',
        channel_config: { webhook_url: webhookUrl.trim() },
        cooldown_minutes: cooldown,
      });
      setWebhookUrl('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to connect Slack for this alert.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Alerts</h1>
        <p className="text-sm text-text-muted">
          Get a Slack message the moment something needs your attention.
        </p>
      </div>

      <Card className="p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-elevated">
            <SlackIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-medium text-text-primary">Connect to Slack</h2>
            <p className="text-sm text-text-muted">
              Paste an incoming webhook URL and choose what should trigger it.
            </p>
          </div>
        </div>

        <form
          onSubmit={(event) => void handleConnect(event)}
          noValidate
          className="flex flex-col gap-4"
        >
          <TextField
            label="Slack webhook URL"
            type="text"
            mono
            required
            value={webhookUrl}
            onChange={(event) => setWebhookUrl(event.target.value)}
            placeholder="https://hooks.slack.com/services/…"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
            <SelectField
              label="Notify Slack when…"
              value={conditionValue}
              onChange={(event) => setConditionValue(event.target.value)}
            >
              {ALERT_CONDITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>

            <TextField
              label="Cooldown (minutes)"
              type="number"
              mono
              min={1}
              className="sm:w-40"
              value={cooldownMinutes}
              onChange={(event) => setCooldownMinutes(event.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-status-critical/10 px-3 py-2 text-sm text-status-critical">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={createRule.isPending}
            className="mt-1 flex w-fit items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-card transition-colors duration-150 hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SlackIcon className="h-4 w-4" />
            {createRule.isPending ? 'Connecting…' : 'Connect to Slack'}
          </button>
        </form>
      </Card>

      <Card className="flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-medium text-text-primary">Alert rules</h2>
          <span className="text-sm text-text-muted">{alertRules.data?.length ?? 0}</span>
        </div>
        <AsyncBoundary
          isLoading={alertRules.isLoading}
          isError={alertRules.isError}
          data={alertRules.data}
        >
          {(rules) =>
            rules.length === 0 ? (
              <EmptyState
                icon={<BellIcon className="h-full w-full" />}
                title="No alert rules yet"
                description="Connect Slack above to get notified the moment something needs attention."
              />
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-text-muted">
                      Name
                    </th>
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-text-muted">
                      Channel
                    </th>
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-text-muted">
                      Cooldown
                    </th>
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-text-muted">
                      Created
                    </th>
                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-text-muted">
                      Enabled
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr
                      key={rule.id}
                      className="border-b border-border transition-colors duration-100 last:border-b-0 hover:bg-bg-elevated/60"
                    >
                      <td className="px-5 py-3.5 font-medium text-text-primary">{rule.name}</td>
                      <td className="px-5 py-3.5 text-text-secondary">
                        <span className="inline-flex items-center gap-1.5">
                          {rule.channel === 'slack' && <SlackIcon className="h-3.5 w-3.5" />}
                          {rule.channel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-text-secondary">
                        {rule.cooldown_minutes}m
                      </td>
                      <td className="px-5 py-3.5 text-text-muted">
                        {formatTimestamp(rule.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Switch
                          checked={rule.enabled}
                          disabled={setEnabled.isPending}
                          label={`${rule.enabled ? 'Disable' : 'Enable'} ${rule.name}`}
                          onChange={(enabled) => setEnabled.mutate({ id: rule.id, enabled })}
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => deleteRule.mutate(rule.id)}
                          disabled={deleteRule.isPending}
                          className="text-sm text-text-muted transition-colors duration-150 hover:text-status-critical disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </AsyncBoundary>
      </Card>
    </div>
  );
}

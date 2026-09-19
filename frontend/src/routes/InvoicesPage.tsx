import { FormEvent, useState } from 'react';
import {
  useCloudAccounts,
  useConnectCloudAccount,
  useDisconnectCloudAccount,
} from '../hooks/useCloudAccounts';
import { useToast } from '../context/ToastContext';
import { AsyncBoundary } from '../components/AsyncBoundary';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { CloudIcon, InvoicesIcon, PlugIcon } from '../components/icons';
import { ApiError } from '../lib/apiClient';
import { formatTimestamp } from '../lib/formatters';
import type { CloudAccount } from '../lib/types';

function ProviderCard({ account }: { account: CloudAccount }) {
  const connect = useConnectCloudAccount();
  const disconnect = useDisconnectCloudAccount();
  const { showToast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [label, setLabel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    try {
      await connect.mutateAsync({ provider: account.provider, label: label.trim(), apiKey });
      setIsConnecting(false);
      setLabel('');
      setApiKey('');
      showToast(`${account.provider_label} connected`, 'success');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to connect this provider.');
    }
  };

  const handleDisconnect = async (): Promise<void> => {
    if (!account.id) return;
    await disconnect.mutateAsync(account.id);
    showToast(`${account.provider_label} disconnected`, 'info');
  };

  return (
    <Card className="flex flex-col p-5 transition-all duration-200 ease-smooth hover:-translate-y-0.5 hover:shadow-popover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-elevated">
            <CloudIcon className="h-5 w-5 text-text-secondary" />
          </div>
          <div>
            <h3 className="font-medium text-text-primary">{account.provider_label}</h3>
            <span
              className={`text-xs font-medium ${
                account.connected ? 'text-status-healthy' : 'text-text-muted'
              }`}
            >
              {account.connected ? 'Connected' : 'Not connected'}
            </span>
          </div>
        </div>
      </div>

      {account.connected ? (
        <div className="mt-4 flex flex-col gap-1 text-sm">
          <span className="text-text-secondary">{account.label}</span>
          <span className="text-text-muted">
            Connected {account.connected_at ? formatTimestamp(account.connected_at) : ''}
          </span>
          <span className="mt-2 text-text-muted">
            Cost &amp; usage sync for this provider is coming soon.
          </span>
          <button
            type="button"
            onClick={() => void handleDisconnect()}
            disabled={disconnect.isPending}
            className="mt-3 w-fit text-sm font-medium text-text-muted transition-colors duration-150 ease-smooth hover:text-status-critical disabled:cursor-not-allowed disabled:opacity-50"
          >
            Disconnect
          </button>
        </div>
      ) : isConnecting ? (
        <form
          onSubmit={(event) => void handleConnect(event)}
          noValidate
          className="mt-4 flex flex-col gap-3"
        >
          <TextField
            label="Label"
            type="text"
            required
            placeholder={`My ${account.provider_label} account`}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
          <TextField
            label="API key / token"
            type="password"
            mono
            required
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
          {error && <p className="text-sm text-status-critical">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={connect.isPending}
              className="flex items-center gap-1.5 rounded-lg btn-gradient px-3 py-2 text-sm font-medium shadow-card transition-all duration-150 ease-smooth hover:-translate-y-px hover:shadow-popover active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PlugIcon className="h-3.5 w-3.5" />
              {connect.isPending ? 'Connecting…' : 'Connect'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsConnecting(false);
                setError(null);
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors duration-150 hover:bg-bg-elevated hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsConnecting(true)}
          className="mt-4 flex w-fit items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-primary transition-all duration-150 ease-smooth hover:border-border-strong hover:bg-bg-elevated active:scale-95"
        >
          <PlugIcon className="h-3.5 w-3.5" />
          Connect
        </button>
      )}
    </Card>
  );
}

export function InvoicesPage() {
  const cloudAccounts = useCloudAccounts();
  const connectedCount = cloudAccounts.data?.filter((a) => a.connected).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-text-primary">
          <InvoicesIcon className="h-6 w-6 text-accent" />
          Invoices &amp; billing
        </h1>
        <p className="text-sm text-text-muted">
          Connect the providers you host on to see what's running, what's idle, and what you owe in
          one place - {connectedCount} of {cloudAccounts.data?.length ?? 7} connected.
        </p>
      </div>

      <AsyncBoundary
        isLoading={cloudAccounts.isLoading}
        isError={cloudAccounts.isError}
        data={cloudAccounts.data}
      >
        {(accounts) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <ProviderCard key={account.provider} account={account} />
            ))}
          </div>
        )}
      </AsyncBoundary>
    </div>
  );
}

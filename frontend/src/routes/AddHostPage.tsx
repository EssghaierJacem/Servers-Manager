import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateHost } from '../hooks/useHosts';
import { Card } from '../components/Card';
import { ApiError } from '../lib/apiClient';
import { isPlausibleIpAddress } from '../lib/ipAddress';
import type { HostProvider } from '../lib/types';

const PROVIDERS: HostProvider[] = [
  'azure',
  'vmware',
  'ovh',
  'aws',
  'digitalocean',
  'bare_metal',
  'other',
];

const DEFAULT_SSH_PORT = 22;

export function AddHostPage() {
  const navigate = useNavigate();
  const createHost = useCreateHost();

  const [name, setName] = useState('');
  const [provider, setProvider] = useState<HostProvider>('other');
  const [ipAddress, setIpAddress] = useState('');
  const [sshPort, setSshPort] = useState(String(DEFAULT_SSH_PORT));
  const [sshUser, setSshUser] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setValidationError(null);

    if (name.trim().length === 0) {
      setValidationError('Name is required.');
      return;
    }
    if (!isPlausibleIpAddress(ipAddress)) {
      setValidationError('Enter a valid IPv4 or IPv6 address.');
      return;
    }
    const port = Number(sshPort);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      setValidationError('SSH port must be a number between 1 and 65535.');
      return;
    }
    if (sshUser.trim().length === 0) {
      setValidationError('SSH user is required.');
      return;
    }

    try {
      const host = await createHost.mutateAsync({
        name: name.trim(),
        provider,
        ip_address: ipAddress.trim(),
        ssh_port: port,
        ssh_user: sshUser.trim(),
      });
      navigate(`/hosts/${host.id}`, { replace: true });
    } catch (err) {
      setValidationError(err instanceof ApiError ? err.message : 'Unable to add this host.');
    }
  };

  const error = validationError ?? (createHost.isError ? 'Unable to add this host.' : null);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl text-text-primary">Add host</h1>

      <Card className="max-w-md p-6">
        <form
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-text-muted">Name</span>
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="prod-web-01"
              className="rounded border border-border bg-bg-base px-3 py-2 font-mono text-sm text-text-primary outline-none focus-visible:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-text-muted">Provider</span>
            <select
              value={provider}
              onChange={(event) => setProvider(event.target.value as HostProvider)}
              className="rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-primary outline-none focus-visible:border-accent"
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-text-muted">IP address</span>
            <input
              type="text"
              required
              value={ipAddress}
              onChange={(event) => setIpAddress(event.target.value)}
              placeholder="203.0.113.10"
              className="rounded border border-border bg-bg-base px-3 py-2 font-mono text-sm text-text-primary outline-none focus-visible:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-text-muted">SSH port</span>
            <input
              type="number"
              required
              min={1}
              max={65535}
              value={sshPort}
              onChange={(event) => setSshPort(event.target.value)}
              className="rounded border border-border bg-bg-base px-3 py-2 font-mono text-sm text-text-primary outline-none focus-visible:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-text-muted">SSH user</span>
            <input
              type="text"
              required
              value={sshUser}
              onChange={(event) => setSshUser(event.target.value)}
              placeholder="ubuntu"
              className="rounded border border-border bg-bg-base px-3 py-2 font-mono text-sm text-text-primary outline-none focus-visible:border-accent"
            />
          </label>

          {error && <p className="text-sm text-status-critical">{error}</p>}

          <button
            type="submit"
            disabled={createHost.isPending}
            className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg-base hover:bg-accent/90 disabled:opacity-50"
          >
            {createHost.isPending ? 'Adding host...' : 'Add host'}
          </button>
        </form>
      </Card>
    </div>
  );
}

import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateHost } from '../hooks/useHosts';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
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

const SELECT_CLASS =
  'rounded-lg border border-border bg-bg-base px-3.5 py-2.5 text-sm text-text-primary outline-none transition-colors duration-150 hover:border-border-strong focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25';

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
      setValidationError('Give this host a name so you can recognize it later.');
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
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Add host</h1>
        <p className="text-sm text-text-muted">
          We'll generate a dedicated SSH keypair for this host - you'll never handle a private key
          directly.
        </p>
      </div>

      <Card className="max-w-md p-6">
        <form
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
          className="flex flex-col gap-4"
        >
          <TextField
            label="Name"
            type="text"
            required
            mono
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="prod-web-01"
          />

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-secondary">Provider</span>
            <select
              value={provider}
              onChange={(event) => setProvider(event.target.value as HostProvider)}
              className={SELECT_CLASS}
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <TextField
            label="IP address"
            type="text"
            required
            mono
            value={ipAddress}
            onChange={(event) => setIpAddress(event.target.value)}
            placeholder="203.0.113.10"
          />

          <TextField
            label="SSH port"
            type="number"
            required
            mono
            min={1}
            max={65535}
            value={sshPort}
            onChange={(event) => setSshPort(event.target.value)}
          />

          <TextField
            label="SSH user"
            type="text"
            required
            mono
            value={sshUser}
            onChange={(event) => setSshUser(event.target.value)}
            placeholder="ubuntu"
          />

          {error && (
            <p className="rounded-lg bg-status-critical/10 px-3 py-2 text-sm text-status-critical">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={createHost.isPending}
            className="mt-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-card transition-colors duration-150 hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createHost.isPending ? 'Adding host…' : 'Add host'}
          </button>
        </form>
      </Card>
    </div>
  );
}

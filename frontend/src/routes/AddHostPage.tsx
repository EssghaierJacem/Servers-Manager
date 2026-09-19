import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateHost } from '../hooks/useHosts';
import { Card } from '../components/Card';
import { SelectField, TextField } from '../components/TextField';
import { useToast } from '../context/ToastContext';
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
  const { showToast } = useToast();

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
      showToast(`${host.name} was added - finish setup to bring it online.`, 'success');
      navigate(`/hosts/${host.id}`, { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to add this host.';
      setValidationError(message);
      showToast(message, 'error');
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

          <SelectField
            label="Provider"
            value={provider}
            onChange={(event) => setProvider(event.target.value as HostProvider)}
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </SelectField>

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
            className="mt-2 rounded-lg btn-gradient px-4 py-2.5 text-sm font-medium shadow-card transition-all duration-150 ease-smooth hover:-translate-y-px hover:shadow-popover active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {createHost.isPending ? 'Adding host…' : 'Add host'}
          </button>
        </form>
      </Card>
    </div>
  );
}

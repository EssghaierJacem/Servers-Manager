import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SetupInstructionsPanel } from './SetupInstructionsPanel';
import { apiClient } from '../lib/apiClient';
import type { HealthCheckLog } from '../lib/types';

vi.mock('../lib/apiClient', async () => {
  const actual = await vi.importActual<typeof import('../lib/apiClient')>('../lib/apiClient');
  return {
    ...actual,
    apiClient: { ...actual.apiClient, get: vi.fn(), post: vi.fn() },
  };
});

function renderPanel(lastLog?: HealthCheckLog) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <SetupInstructionsPanel hostId="host-1" hostName="prod-web-01" lastLog={lastLog} />
    </QueryClientProvider>,
  );
}

describe('SetupInstructionsPanel', () => {
  it('shows the public key and bootstrap command fetched from setup-instructions', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      ssh_public_key: 'ssh-ed25519 AAAA test',
      bootstrap_command: 'mkdir -p ~/.ssh && echo test',
    });

    renderPanel();

    expect(await screen.findByText('ssh-ed25519 AAAA test')).toBeInTheDocument();
    expect(screen.getByText('mkdir -p ~/.ssh && echo test')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/hosts/host-1/setup-instructions');
  });

  it('calls the check endpoint when "Verify connection" is clicked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      ssh_public_key: 'ssh-ed25519 AAAA test',
      bootstrap_command: 'echo test',
    });
    vi.mocked(apiClient.post).mockResolvedValue({ job_id: 'job-1' });

    renderPanel();
    await screen.findByText('ssh-ed25519 AAAA test');

    fireEvent.click(screen.getByRole('button', { name: 'Verify connection' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/hosts/host-1/check'));
  });

  it('shows a clear "key not installed" message, not a vague failure, when that is the last result', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      ssh_public_key: 'ssh-ed25519 AAAA test',
      bootstrap_command: 'echo test',
    });

    renderPanel({
      id: 'log-1',
      status: 'pending_setup',
      raw_output: { reason: 'key_not_installed' },
      checked_at: new Date().toISOString(),
    });

    expect(await screen.findByText(/Key not installed yet/i)).toBeInTheDocument();
  });

  it('does not show the "key not installed" hint before any check has run', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      ssh_public_key: 'ssh-ed25519 AAAA test',
      bootstrap_command: 'echo test',
    });

    renderPanel(undefined);

    await screen.findByText('ssh-ed25519 AAAA test');
    expect(screen.queryByText(/Key not installed yet/i)).not.toBeInTheDocument();
  });
});

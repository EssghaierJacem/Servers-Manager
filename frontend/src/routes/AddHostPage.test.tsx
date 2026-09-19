import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddHostPage } from './AddHostPage';
import { apiClient } from '../lib/apiClient';
import { ToastProvider } from '../context/ToastContext';

vi.mock('../lib/apiClient', async () => {
  const actual = await vi.importActual<typeof import('../lib/apiClient')>('../lib/apiClient');
  return { ...actual, apiClient: { ...actual.apiClient, post: vi.fn() } };
});

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AddHostPage />
        </MemoryRouter>
      </QueryClientProvider>
    </ToastProvider>,
  );
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'prod-web-01' } });
  fireEvent.change(screen.getByLabelText('IP address'), { target: { value: '203.0.113.10' } });
  fireEvent.change(screen.getByLabelText('SSH user'), { target: { value: 'ubuntu' } });
}

describe('AddHostPage', () => {
  it('rejects an empty name before sending any request', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('IP address'), { target: { value: '203.0.113.10' } });
    fireEvent.change(screen.getByLabelText('SSH user'), { target: { value: 'ubuntu' } });

    fireEvent.click(screen.getByRole('button', { name: 'Add host' }));

    expect(
      screen.getByText('Give this host a name so you can recognize it later.'),
    ).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('rejects a malformed IP address before sending any request', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'prod-web-01' } });
    fireEvent.change(screen.getByLabelText('IP address'), { target: { value: 'not-an-ip' } });
    fireEvent.change(screen.getByLabelText('SSH user'), { target: { value: 'ubuntu' } });

    fireEvent.click(screen.getByRole('button', { name: 'Add host' }));

    expect(screen.getByText('Enter a valid IPv4 or IPv6 address.')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('rejects an empty SSH user before sending any request', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'prod-web-01' } });
    fireEvent.change(screen.getByLabelText('IP address'), { target: { value: '203.0.113.10' } });

    fireEvent.click(screen.getByRole('button', { name: 'Add host' }));

    expect(screen.getByText('SSH user is required.')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('submits the expected payload once the form is valid', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      id: 'host-1',
      status: 'pending_setup',
      ssh_public_key: 'ssh-ed25519 AAAA test',
      bootstrap_command: 'echo test',
    });

    renderPage();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Add host' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(1));
    expect(apiClient.post).toHaveBeenCalledWith('/hosts', {
      name: 'prod-web-01',
      provider: 'other',
      ip_address: '203.0.113.10',
      ssh_port: 22,
      ssh_user: 'ubuntu',
    });
  });
});

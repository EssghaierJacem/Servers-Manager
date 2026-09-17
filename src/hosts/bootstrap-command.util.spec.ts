import { buildBootstrapCommand } from './bootstrap-command.util';

describe('buildBootstrapCommand', () => {
  it('builds a one-liner that appends the public key to authorized_keys with correct permissions', () => {
    const command = buildBootstrapCommand(
      'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... servers-manager',
    );

    expect(command).toBe(
      'mkdir -p ~/.ssh && chmod 700 ~/.ssh && ' +
        'echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... servers-manager" >> ~/.ssh/authorized_keys && ' +
        'chmod 600 ~/.ssh/authorized_keys',
    );
  });

  it('is a single shell line with no embedded newlines', () => {
    const command = buildBootstrapCommand('ssh-ed25519 AAAA key-comment');

    expect(command).not.toContain('\n');
  });
});

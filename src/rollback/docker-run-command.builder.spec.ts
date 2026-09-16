import { DeploymentConfigBlob } from '../deployment-snapshots/deployment-config-blob.interface';
import { buildDockerRunCommand, shellEscape } from './docker-run-command.builder';

function config(overrides: Partial<DeploymentConfigBlob> = {}): DeploymentConfigBlob {
  return {
    containerName: 'my-app',
    env: [],
    portBindings: [],
    restartPolicy: '',
    ...overrides,
  };
}

describe('shellEscape', () => {
  it('wraps a plain value in single quotes', () => {
    expect(shellEscape('hello')).toBe("'hello'");
  });

  it('neutralizes an embedded single quote', () => {
    expect(shellEscape("it's")).toBe(`'it'\\''s'`);
  });

  it('neutralizes shell metacharacters instead of letting them execute', () => {
    const malicious = '$(rm -rf /); `echo pwned`; & | ; > out.txt';
    const escaped = shellEscape(malicious);
    // Everything is inside a single-quoted string (with the one embedded
    // quote handled above) - none of these characters get shell-interpreted.
    expect(escaped.startsWith("'")).toBe(true);
    expect(escaped).toContain(malicious);
  });

  it('handles a value containing only single quotes', () => {
    const escaped = shellEscape("'''");
    // Every quote in the input becomes the 4-char escape sequence '\'',
    // wrapped in the usual opening/closing quote.
    expect(escaped).toBe(`'${"'\\''".repeat(3)}'`);
    expect(escaped.startsWith("'")).toBe(true);
    expect(escaped.endsWith("'")).toBe(true);
  });
});

describe('buildDockerRunCommand', () => {
  it('builds a minimal command with just a name and image', () => {
    const command = buildDockerRunCommand(config(), 'nginx:1.25');
    expect(command).toBe("docker run -d --name 'my-app' 'nginx:1.25'");
  });

  it('includes port bindings, env vars, and restart policy in order', () => {
    const command = buildDockerRunCommand(
      config({
        portBindings: ['8080:80/tcp', '8443:443/tcp'],
        env: ['NODE_ENV=production', 'PORT=3000'],
        restartPolicy: 'unless-stopped',
      }),
      'myapp:2.0',
    );

    expect(command).toBe(
      "docker run -d --name 'my-app' " +
        "-p '8080:80/tcp' -p '8443:443/tcp' " +
        "-e 'NODE_ENV=production' -e 'PORT=3000' " +
        "--restart 'unless-stopped' 'myapp:2.0'",
    );
  });

  it('omits --restart entirely when there is no restart policy', () => {
    const command = buildDockerRunCommand(config({ restartPolicy: '' }), 'myapp:1.0');
    expect(command).not.toContain('--restart');
  });

  it('safely escapes an env var value containing shell metacharacters', () => {
    const command = buildDockerRunCommand(
      config({ env: ["API_KEY=abc'; rm -rf / #"] }),
      'myapp:1.0',
    );

    // The dangerous value must appear only inside its own single-quoted
    // token - never as an unescaped command separator.
    expect(command).toContain(shellEscape("API_KEY=abc'; rm -rf / #"));
    expect(command).not.toMatch(/[^']; rm -rf/);
  });

  it('escapes a container name containing spaces and special characters', () => {
    const command = buildDockerRunCommand(config({ containerName: 'my app $(whoami)' }), 'x:1');
    expect(command).toContain(shellEscape('my app $(whoami)'));
  });
});

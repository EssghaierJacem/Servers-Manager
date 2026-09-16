import { parseDockerInspectOutput } from './docker-inspect-parser';

function inspectJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify([
    {
      Name: '/my-app',
      Config: {
        Env: ['NODE_ENV=production', 'PORT=3000'],
      },
      HostConfig: {
        PortBindings: {
          '3000/tcp': [{ HostIp: '0.0.0.0', HostPort: '8080' }],
        },
        RestartPolicy: { Name: 'always' },
      },
      ...overrides,
    },
  ]);
}

describe('parseDockerInspectOutput', () => {
  it('extracts container name, env, port bindings, and restart policy', () => {
    const result = parseDockerInspectOutput(inspectJson());

    expect(result).toEqual({
      containerName: 'my-app',
      env: ['NODE_ENV=production', 'PORT=3000'],
      portBindings: ['8080:3000/tcp'],
      restartPolicy: 'always',
    });
  });

  it('strips the leading slash docker always puts on Name', () => {
    const result = parseDockerInspectOutput(inspectJson({ Name: '/web-1' }));
    expect(result?.containerName).toBe('web-1');
  });

  it('flattens multiple published ports', () => {
    const result = parseDockerInspectOutput(
      inspectJson({
        HostConfig: {
          PortBindings: {
            '80/tcp': [{ HostIp: '0.0.0.0', HostPort: '8080' }],
            '443/tcp': [{ HostIp: '0.0.0.0', HostPort: '8443' }],
          },
          RestartPolicy: { Name: 'unless-stopped' },
        },
      }),
    );

    expect(result?.portBindings.sort()).toEqual(['8080:80/tcp', '8443:443/tcp'].sort());
  });

  it('skips exposed-but-not-published ports (null binding list)', () => {
    const result = parseDockerInspectOutput(
      inspectJson({
        HostConfig: {
          PortBindings: { '9000/tcp': null },
          RestartPolicy: { Name: '' },
        },
      }),
    );

    expect(result?.portBindings).toEqual([]);
  });

  it('defaults to an empty restart policy when none is set', () => {
    const result = parseDockerInspectOutput(
      inspectJson({ HostConfig: { PortBindings: {}, RestartPolicy: { Name: '' } } }),
    );
    expect(result?.restartPolicy).toBe('');
  });

  it('defaults to no env vars when Config.Env is absent', () => {
    const result = parseDockerInspectOutput(inspectJson({ Config: {} }));
    expect(result?.env).toEqual([]);
  });

  it('returns null for unparseable JSON', () => {
    expect(parseDockerInspectOutput('not json')).toBeNull();
  });

  it('returns null for an empty array (no such container)', () => {
    expect(parseDockerInspectOutput('[]')).toBeNull();
  });

  it('returns null when the container has no name', () => {
    expect(parseDockerInspectOutput(inspectJson({ Name: '' }))).toBeNull();
  });
});

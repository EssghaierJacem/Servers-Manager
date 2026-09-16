import { parseDockerPsOutput, splitImageAndTag } from './docker-ps-parser';

describe('parseDockerPsOutput', () => {
  it('parses multiple newline-delimited JSON lines', () => {
    const stdout = [
      '{"ID":"abc123","Names":"web-1","Image":"nginx:1.25","Status":"Up 2 hours","Ports":"0.0.0.0:80->80/tcp"}',
      '{"ID":"def456","Names":"worker-1","Image":"myapp:latest","Status":"Exited (0) 3 minutes ago","Ports":""}',
    ].join('\n');

    const result = parseDockerPsOutput(stdout);

    expect(result.containers).toHaveLength(2);
    expect(result.skippedLines).toBe(0);
    expect(result.containers[0]).toEqual({
      id: 'abc123',
      names: 'web-1',
      image: 'nginx:1.25',
      status: 'Up 2 hours',
      ports: '0.0.0.0:80->80/tcp',
    });
  });

  it('returns an empty result for empty stdout (no containers)', () => {
    expect(parseDockerPsOutput('')).toEqual({ containers: [], skippedLines: 0 });
    expect(parseDockerPsOutput('   \n  \n')).toEqual({ containers: [], skippedLines: 0 });
  });

  it('skips malformed JSON lines without discarding the valid ones', () => {
    const stdout = [
      '{"ID":"abc123","Names":"web-1","Image":"nginx:1.25","Status":"Up 2 hours","Ports":""}',
      'not-json-at-all',
      '{"ID":"def456"', // truncated
    ].join('\n');

    const result = parseDockerPsOutput(stdout);

    expect(result.containers).toHaveLength(1);
    expect(result.skippedLines).toBe(2);
  });

  it('skips a line missing required fields', () => {
    const stdout = '{"ID":"abc123","Names":"web-1"}'; // missing Image/Status

    const result = parseDockerPsOutput(stdout);

    expect(result.containers).toHaveLength(0);
    expect(result.skippedLines).toBe(1);
  });
});

describe('splitImageAndTag', () => {
  it('splits a simple repo:tag reference', () => {
    expect(splitImageAndTag('nginx:1.25')).toEqual({ image: 'nginx', tag: '1.25' });
  });

  it('handles an untagged image with no colon', () => {
    expect(splitImageAndTag('nginx')).toEqual({ image: 'nginx', tag: null });
  });

  it('does not mistake a registry host:port for a tag separator', () => {
    expect(splitImageAndTag('myregistry.com:5000/nginx')).toEqual({
      image: 'myregistry.com:5000/nginx',
      tag: null,
    });
  });

  it('splits repo:tag correctly when a registry host:port is also present', () => {
    expect(splitImageAndTag('myregistry.com:5000/nginx:1.25')).toEqual({
      image: 'myregistry.com:5000/nginx',
      tag: '1.25',
    });
  });

  it('treats a digest reference as untagged rather than mis-splitting it', () => {
    expect(
      splitImageAndTag('nginx@sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab'),
    ).toEqual({
      image: 'nginx@sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      tag: null,
    });
  });
});

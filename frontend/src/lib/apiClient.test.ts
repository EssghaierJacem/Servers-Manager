import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, configureApiClient } from './apiClient';

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('apiClient', () => {
  let onAuthExpired: ReturnType<typeof vi.fn>;
  let setAccessToken: ReturnType<typeof vi.fn>;
  let currentAccessToken: string | null;
  let currentRefreshToken: string | null;

  beforeEach(() => {
    currentAccessToken = 'initial-access-token';
    currentRefreshToken = 'a-refresh-token';
    onAuthExpired = vi.fn();
    setAccessToken = vi.fn((token: string) => {
      currentAccessToken = token;
    });

    configureApiClient({
      getAccessToken: () => currentAccessToken,
      getRefreshToken: () => currentRefreshToken,
      setAccessToken,
      onAuthExpired,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('attaches the access token as a Bearer header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await apiClient.get('/hosts');

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((requestInit.headers as Record<string, string>).Authorization).toBe(
      'Bearer initial-access-token',
    );
  });

  it('silently refreshes and retries once on a 401, without the caller seeing an error', async () => {
    const fetchMock = vi
      .fn()
      // First attempt with the stale token -> 401
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      // The refresh call
      .mockResolvedValueOnce(jsonResponse({ access_token: 'fresh-access-token' }))
      // The retried original request, now with the fresh token
      .mockResolvedValueOnce(jsonResponse({ id: 'host-1' }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiClient.get<{ id: string }>('/hosts/host-1');

    expect(result).toEqual({ id: 'host-1' });
    expect(setAccessToken).toHaveBeenCalledWith('fresh-access-token');
    expect(onAuthExpired).not.toHaveBeenCalled();

    const retryCall = fetchMock.mock.calls[2] as [string, RequestInit];
    expect((retryCall[1].headers as Record<string, string>).Authorization).toBe(
      'Bearer fresh-access-token',
    );
  });

  it('coalesces concurrent 401s into a single refresh call', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 })) // request A, attempt 1
      .mockResolvedValueOnce(new Response(null, { status: 401 })) // request B, attempt 1
      .mockResolvedValueOnce(jsonResponse({ access_token: 'fresh-access-token' })) // the one refresh call
      .mockResolvedValueOnce(jsonResponse({ a: 1 })) // request A retried
      .mockResolvedValueOnce(jsonResponse({ b: 1 })); // request B retried
    vi.stubGlobal('fetch', fetchMock);

    const [a, b] = await Promise.all([apiClient.get('/a'), apiClient.get('/b')]);

    expect(a).toEqual({ a: 1 });
    expect(b).toEqual({ b: 1 });

    const refreshCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('/auth/refresh'),
    );
    expect(refreshCalls).toHaveLength(1);
  });

  it('calls onAuthExpired and throws when refresh itself fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 })); // refresh endpoint also rejects
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.get('/hosts')).rejects.toThrow();
    expect(onAuthExpired).toHaveBeenCalledTimes(1);
  });
});

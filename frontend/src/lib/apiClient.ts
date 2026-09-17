const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface TokenAccessors {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setAccessToken: (token: string) => void;
  onAuthExpired: () => void;
}

let tokenAccessors: TokenAccessors | null = null;

/** Wires the API client to the in-memory auth store - called once from AuthProvider. */
export function configureApiClient(accessors: TokenAccessors): void {
  tokenAccessors = accessors;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!tokenAccessors) return null;
  const refreshToken = tokenAccessors.getRefreshToken();
  if (!refreshToken) return null;

  // Coalesce concurrent 401s into a single refresh call.
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const data = (await response.json()) as { access_token: string };
        tokenAccessors?.setAccessToken(data.access_token);
        return data.access_token;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Set only for the login/refresh calls themselves, to avoid an infinite retry loop. */
  skipAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const accessToken = tokenAccessors?.getAccessToken();
    if (accessToken && !options.skipAuth) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    return fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  };

  let response = await doFetch();

  if (response.status === 401 && !options.skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await doFetch();
    } else {
      tokenAccessors?.onAuthExpired();
      throw new ApiError(401, 'Session expired');
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      (body && typeof body === 'object' && 'message' in body && String(body.message)) ||
      response.statusText;
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Pick<RequestOptions, 'skipAuth'>) =>
    request<T>(path, { method: 'POST', body, ...options }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

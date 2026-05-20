/**
 * Authenticated fetch helper for /api/* routes.
 * Automatically injects the Clerk Bearer token.
 *
 * The token is sourced from:
 * 1. An explicit getToken function passed as the second argument (for callers that have it)
 * 2. The global token set via setGlobalGetToken (set by AuthProvider on mount)
 *
 * Usage (explicit token):
 *   const { getToken } = useAuth();
 *   const res = await apiFetch("/api/admins", getToken);
 *   const res = await apiFetch("/api/send-email", getToken, { method: "POST", body: ... });
 *
 * Usage (no explicit token — uses global):
 *   const res = await apiFetch("/api/pages/home", { method: "PUT", body: ... });
 */

let _globalGetToken: (() => Promise<string | null>) | null = null;

export function setGlobalGetToken(fn: () => Promise<string | null>): void {
  _globalGetToken = fn;
}

export async function apiFetch(
  url: string,
  getTokenOrOptions?: (() => Promise<string | null>) | RequestInit,
  options: RequestInit = {},
): Promise<Response> {
  let resolvedGetToken: (() => Promise<string | null>) | null = null;
  let resolvedOptions: RequestInit = options;

  if (typeof getTokenOrOptions === "function") {
    resolvedGetToken = getTokenOrOptions;
  } else if (getTokenOrOptions !== undefined) {
    resolvedOptions = getTokenOrOptions;
  }

  if (!resolvedGetToken) resolvedGetToken = _globalGetToken;

  const token = resolvedGetToken ? await resolvedGetToken() : null;

  return fetch(url, {
    ...resolvedOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(resolvedOptions.headers ?? {}),
    },
  });
}

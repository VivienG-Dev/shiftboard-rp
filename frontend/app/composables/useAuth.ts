type BetterAuthSession = {
  user?: unknown;
  session?: unknown;
} | null;

type SignInEmailResult = unknown;
type SignUpEmailResult = unknown;
type RequestPasswordResetResult = unknown;
type ResetPasswordResult = unknown;

export function useAuth() {
  const runtimeConfig = useRuntimeConfig();
  const authBasePath = normalizeAuthBasePath(
    runtimeConfig.public.authBasePath as string | undefined
  );
  const backendUrl = normalizeBackendUrl(
    runtimeConfig.public.backendUrl as string | undefined
  );

  const session = useState<BetterAuthSession>("auth.session", () => null);
  const sessionPending = useState<boolean>("auth.sessionPending", () => false);

  // On SSR, forward cookies so `/get-session` can authenticate the request.
  const requestHeaders = import.meta.server
    ? useRequestHeaders(["cookie", "user-agent"])
    : undefined;

  const authFetch = $fetch.create({
    baseURL: `${backendUrl}${authBasePath}`,
    credentials: "include",
    headers: requestHeaders,
  });

  const isAuthenticated = computed(() => Boolean(session.value?.user));

  async function refreshSession() {
    sessionPending.value = true;
    try {
      session.value = await authFetch<BetterAuthSession>("get-session");
    } catch {
      session.value = null;
    } finally {
      sessionPending.value = false;
    }
  }

  async function signInEmail(email: string, password: string) {
    const result = await authFetch<SignInEmailResult>("sign-in/email", {
      method: "POST",
      body: { email, password },
    });
    await refreshSession();
    return result;
  }

  async function signUpEmail(name: string, email: string, password: string) {
    const result = await authFetch<SignUpEmailResult>("sign-up/email", {
      method: "POST",
      body: { name, email, password },
    });
    await refreshSession();
    return result;
  }

  async function signOut() {
    await authFetch("sign-out", { method: "POST" });
    session.value = null;
  }

  async function requestPasswordReset(email: string, redirectTo?: string) {
    const result = await authFetch<RequestPasswordResetResult>(
      "request-password-reset",
      {
        method: "POST",
        body: { email, redirectTo },
      }
    );
    return result;
  }

  async function resetPassword(token: string, newPassword: string) {
    const result = await authFetch<ResetPasswordResult>("reset-password", {
      method: "POST",
      body: { token, newPassword },
    });
    return result;
  }

  return {
    session,
    sessionPending,
    isAuthenticated,
    refreshSession,
    signInEmail,
    signUpEmail,
    signOut,
    requestPasswordReset,
    resetPassword,
  };
}

function normalizeAuthBasePath(value?: string) {
  const fallback = "/api/auth";
  if (!value) return fallback;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  let path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (path === "/api") path = "/api/auth";
  if (!path.startsWith("/api/auth")) path = "/api/auth";
  if (path === "/api") path = "/api/auth";
  return path.replace(/\/$/, "");
}

function normalizeBackendUrl(value?: string) {
  const fallback = "http://localhost:3000";
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/\/$/, "");
}

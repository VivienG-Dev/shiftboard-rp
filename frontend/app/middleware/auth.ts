import { useAuth } from "~/composables/useAuth";
import { watch } from "vue";
import type { Ref } from "vue";

export default defineNuxtRouteMiddleware(async () => {
  const { isAuthenticated, sessionPending, refreshSession } = useAuth();

  // If a session refresh is already in-flight (e.g. from a plugin), wait for it
  // instead of redirecting mid-refresh.
  if (!isAuthenticated.value) {
    if (sessionPending.value) {
      await waitForSessionRefreshToFinish(sessionPending);
    } else {
      await refreshSession();
    }
  }

  if (!isAuthenticated.value) {
    return navigateTo("/sign-in");
  }
});

function waitForSessionRefreshToFinish(sessionPending: Ref<boolean>) {
  if (!sessionPending.value) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const stop = watch(
      sessionPending,
      (pending) => {
        if (!pending) {
          stop();
          resolve();
        }
      },
      { immediate: true }
    );
  });
}

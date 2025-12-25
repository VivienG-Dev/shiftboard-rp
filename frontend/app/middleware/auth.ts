import { useAuth } from "~/composables/useAuth";

export default defineNuxtRouteMiddleware(async () => {
  const { isAuthenticated, sessionPending, refreshSession } = useAuth();

  if (!isAuthenticated.value && !sessionPending.value) {
    await refreshSession();
  }

  if (!isAuthenticated.value) {
    return navigateTo("/sign-in");
  }
});

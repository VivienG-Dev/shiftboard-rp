import { useAuth } from "~/composables/useAuth";

export default defineNuxtPlugin(async () => {
  const { refreshSession } = useAuth();
  await refreshSession();
});

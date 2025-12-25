<script setup lang="ts">
import { useAuth } from "~/composables/useAuth";

definePageMeta({
  middleware: "auth",
  ssr: false,
});

const { session } = useAuth();
</script>

<template>
  <div class="p-6 space-y-3">
    <h1 class="text-2xl font-semibold">Me</h1>
    <pre class="text-xs bg-muted p-3 rounded-md overflow-auto">{{
      session
    }}</pre>
  </div>
</template>

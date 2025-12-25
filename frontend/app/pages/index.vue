<script setup lang="ts">
import { useAuth } from "~/composables/useAuth";

const { isAuthenticated, session, signOut } = useAuth();
</script>

<template>
  <div class="p-6 space-y-4">
    <h1 class="text-2xl font-semibold">ShiftBoard RP</h1>

    <div v-if="isAuthenticated" class="space-y-2">
      <div class="text-sm text-muted-foreground">Signed in</div>
      <pre class="text-xs bg-muted p-3 rounded-md overflow-auto">{{ session }}</pre>
      <button class="underline text-sm" @click="signOut">Sign out</button>
    </div>

    <div v-else class="space-y-2">
      <div class="text-sm text-muted-foreground">Not signed in</div>
      <NuxtLink class="underline text-sm" to="/sign-in">Go to sign in</NuxtLink>
    </div>
  </div>
</template>

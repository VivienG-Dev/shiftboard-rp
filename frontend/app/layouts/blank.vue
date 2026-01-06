<script setup lang="ts">
const route = useRoute();
const isHome = computed(() => route.path === "/");
</script>

<template>
  <div class="flex min-h-svh flex-col">
    <main
      :class="[
        'relative flex flex-1 flex-col',
        isHome &&
          'overflow-hidden bg-linear-to-br from-background via-muted/40 to-background text-foreground',
      ]"
    >
      <div
        v-if="isHome"
        class="pointer-events-none absolute inset-0 [background:radial-gradient(1000px_circle_at_15%_10%,rgba(34,211,238,0.18),transparent_55%),radial-gradient(900px_circle_at_85%_35%,rgba(225,29,72,0.14),transparent_55%)]"
      />
      <div class="relative flex-1">
        <NuxtPage />
      </div>
    </main>
    <AppFooter />
  </div>
</template>

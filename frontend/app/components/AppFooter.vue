<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-vue-next";

const colorMode = useColorMode();

const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};
</script>

<template>
  <footer
    class="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/70 backdrop-blur">
    <div
      class="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
      <div class="text-xs text-muted-foreground">ShiftBoard RP • MVP</div>

      <Button
        variant="ghost"
        class="h-8 px-2 text-foreground"
        @click="toggleTheme"
        :aria-label="`Basculer en mode ${
          colorMode.value === 'dark' ? 'clair' : 'sombre'
        }`">
        <Sun v-if="colorMode.value === 'dark'" class="h-4 w-4" />
        <Moon v-else class="h-4 w-4" />
        <span class="ml-2 text-xs">
          {{ colorMode.value === "dark" ? "Clair" : "Sombre" }}
        </span>
      </Button>
    </div>
  </footer>
</template>

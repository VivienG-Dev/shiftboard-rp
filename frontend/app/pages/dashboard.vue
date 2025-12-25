<script setup lang="ts">
definePageMeta({
  middleware: "auth",
  ssr: false,
});

import { Button } from "@/components/ui/button";
import { useAuth } from "~/composables/useAuth";

navigateTo("/companies");

const { session, signOut } = useAuth();
</script>

<template>
  <div />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "auth",
  ssr: false,
});

const route = useRoute();
const companyId = computed(() => String(route.params.companyId));

await navigateTo(`/companies/${companyId.value}/dashboard`);
</script>

<template />


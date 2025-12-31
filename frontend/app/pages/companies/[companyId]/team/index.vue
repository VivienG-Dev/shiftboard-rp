<script setup lang="ts">
definePageMeta({
  middleware: "auth",
  layout: "company",
  ssr: false,
});

const route = useRoute();
const companyId = computed(() => String(route.params.companyId));

await navigateTo(`/companies/${companyId.value}/team/members`);
</script>

<template />


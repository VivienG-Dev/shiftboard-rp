<script setup lang="ts">
definePageMeta({
  middleware: "auth",
  layout: "company",
  ssr: false,
});

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, Plus } from "lucide-vue-next";
import { useCompanies } from "~/composables/useCompanies";
import type { CompanyLocation } from "~/composables/useCompanies";

const route = useRoute();
const companyId = computed(() => String(route.params.companyId));

const { listCompanyLocations } = useCompanies();

const locations = ref<CompanyLocation[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

async function refresh() {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const res = await listCompanyLocations(companyId.value);
    locations.value = res.data ?? [];
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger les lieux.";
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
}

onMounted(refresh);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Lieux</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Les lieux représentent tes branches (ex: Paris, New York). Les shifts
          pourront être attachés à un lieu.
        </p>
      </div>
      <NuxtLink :to="`/companies/${companyId}/locations/new`">
        <Button
          class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400">
          <Plus class="mr-2 h-4 w-4" />
          Ajouter un lieu
        </Button>
      </NuxtLink>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
      {{ errorMessage }}
    </div>

    <div v-if="isLoading" class="text-sm text-muted-foreground">
      Chargement…
    </div>

    <div
      v-else-if="locations.length === 0"
      class="rounded-2xl border border-border bg-card/60 p-8">
      <div class="text-lg font-semibold">Aucun lieu</div>
      <div class="mt-2 text-sm text-muted-foreground">
        Ajoute ton premier lieu (ex: “Los Santos”, “Paris”…).
      </div>
      <div class="mt-6">
        <NuxtLink :to="`/companies/${companyId}/locations/new`">
          <Button
            class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400">
            Ajouter un lieu
          </Button>
        </NuxtLink>
      </div>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="loc in locations"
        :key="loc.id"
        class="border-border bg-card/60">
        <CardHeader class="space-y-1">
          <CardTitle class="flex items-center gap-2 text-lg">
            <MapPin class="h-4 w-4" />
            {{ loc.name }}
          </CardTitle>
          <CardDescription>ID: {{ loc.id }}</CardDescription>
        </CardHeader>
        <CardContent class="text-sm text-muted-foreground">
          Ce lieu sera utilisé pour filtrer les shifts et stats.
        </CardContent>
      </Card>
    </div>
  </div>
</template>

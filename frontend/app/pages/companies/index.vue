<script setup lang="ts">
definePageMeta({
  middleware: "auth",
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
import { useAuth } from "~/composables/useAuth";
import { useCompanies } from "~/composables/useCompanies";
import type { Company, CompanyType } from "~/composables/useCompanies";

const { signOut } = useAuth();
const { listMyCompanies } = useCompanies();

const companies = ref<Company[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

const typeLabelFr: Record<CompanyType, string> = {
  BAR: "Bar",
  CLUB: "Club",
  FAST_FOOD: "Fast-food",
  OTHER: "Autre",
};

async function refresh() {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const res = await listMyCompanies();
    companies.value = res.data ?? [];
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger tes entreprises.";
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
}

onMounted(refresh);
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b border-border bg-background/70 backdrop-blur">
      <div
        class="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-6 py-5">
        <div class="flex items-center gap-3">
          <NuxtLink to="/" class="flex items-center gap-3 hover:opacity-95">
            <div
              class="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-tr from-cyan-400 to-pink-500 text-xs font-black text-slate-950">
              SB
            </div>
            <div>
              <div class="text-sm font-semibold tracking-tight">
                Mes entreprises
              </div>
              <div class="text-xs text-muted-foreground">
                Choisis une entreprise pour accéder au dashboard.
              </div>
            </div>
          </NuxtLink>
        </div>

        <div class="flex items-center gap-2">
          <NuxtLink to="/me">
            <Button variant="ghost">Profil</Button>
          </NuxtLink>
          <Button variant="ghost" @click="signOut"> Déconnexion </Button>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-6xl px-6 py-10 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">Entreprises</h1>
          <p class="mt-1 text-sm text-muted-foreground">
            Crée une entreprise puis commence à gérer ton inventaire et tes
            shifts.
          </p>
        </div>
        <NuxtLink to="/companies/new">
          <Button
            class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400">
            Créer une entreprise
          </Button>
        </NuxtLink>
      </div>

      <div
        v-if="errorMessage"
        class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
        {{ errorMessage }}
      </div>

      <div v-if="isLoading" class="text-sm text-slate-400">Chargement...</div>

      <div
        v-else-if="companies.length === 0"
        class="rounded-2xl border border-border bg-card/60 p-8">
        <div class="text-lg font-semibold">Aucune entreprise</div>
        <div class="mt-2 text-sm text-muted-foreground">
          Pour commencer, crée ton entreprise (bar, club, fast-food…).
        </div>
        <div class="mt-6 flex flex-wrap gap-2">
          <NuxtLink to="/companies/new">
            <Button
              class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400">
              Créer une entreprise
            </Button>
          </NuxtLink>
          <Button variant="outline" @click="refresh"> Actualiser </Button>
        </div>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="company in companies"
          :key="company.id"
          class="border-border bg-card/60">
          <CardHeader class="space-y-1">
            <CardTitle class="text-lg">{{ company.name }}</CardTitle>
            <CardDescription>
              {{ typeLabelFr[company.type] }} •
              {{ company.locations?.length ?? 0 }} lieu(x)
            </CardDescription>
          </CardHeader>
          <CardContent class="flex items-center justify-between gap-3">
            <div class="text-xs text-muted-foreground truncate">
              <span v-if="company.slug">Slug: {{ company.slug }}</span>
              <span v-else>Slug automatique</span>
            </div>
            <NuxtLink :to="`/companies/${company.id}`">
              <Button variant="secondary">Ouvrir</Button>
            </NuxtLink>
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
</template>

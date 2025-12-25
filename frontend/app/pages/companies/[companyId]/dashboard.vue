<script setup lang="ts">
definePageMeta({
  middleware: "auth",
  ssr: false,
});

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "~/composables/useAuth";
import { useCompanies } from "~/composables/useCompanies";
import type { Company, CompanyType } from "~/composables/useCompanies";

const route = useRoute();
const companyId = computed(() => String(route.params.companyId));

const { signOut } = useAuth();
const { getCompany } = useCompanies();

const company = ref<Company | null>(null);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

const typeLabelFr: Record<CompanyType, string> = {
  BAR: "Bar",
  CLUB: "Club",
  FAST_FOOD: "Fast-food",
  OTHER: "Autre",
};

async function load() {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const res = await getCompany(companyId.value);
    company.value = res.data;
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger l'entreprise.";
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
}

watchEffect(() => {
  if (companyId.value) load();
});
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b border-border bg-background/70 backdrop-blur">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-6 py-5">
        <div class="flex items-center gap-3">
          <NuxtLink to="/companies" class="flex items-center gap-3 hover:opacity-95">
            <div
              class="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-cyan-400 to-pink-500 text-xs font-black text-slate-950">
              SB
            </div>
            <div>
              <div class="text-sm font-semibold tracking-tight">
                {{ company?.name ?? "Dashboard" }}
              </div>
              <div class="text-xs text-muted-foreground">
                <span v-if="company"> {{ typeLabelFr[company.type] }} • {{ company.locations?.length ?? 0 }} lieu(x) </span>
                <span v-else>Chargement...</span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <div class="flex items-center gap-2">
          <NuxtLink to="/companies">
            <Button variant="ghost">Entreprises</Button>
          </NuxtLink>
          <NuxtLink to="/me">
            <Button variant="ghost">Profil</Button>
          </NuxtLink>
          <Button variant="ghost" @click="signOut">Déconnexion</Button>
        </div>
      </div>
    </header>

    <div class="mx-auto w-full max-w-6xl px-6 py-10">
      <div v-if="errorMessage" class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
        {{ errorMessage }}
      </div>

      <div v-else-if="isLoading" class="text-sm text-muted-foreground">
        Chargement...
      </div>

      <div v-else class="space-y-6">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p class="mt-1 text-sm text-muted-foreground">
              Structure inspirée des dashboards shadcn-vue — on branchera ensuite les KPIs, inventaire et shifts.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Button variant="outline" disabled>
              Ajouter un lieu (bientôt)
            </Button>
            <Button class="bg-gradient-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400" disabled>
              Démarrer un shift (bientôt)
            </Button>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card class="border-border bg-card/60">
            <CardHeader class="pb-2">
              <CardTitle class="text-sm text-muted-foreground">Ventes (24h)</CardTitle>
            </CardHeader>
            <CardContent class="text-2xl font-semibold">$0</CardContent>
          </Card>
          <Card class="border-border bg-card/60">
            <CardHeader class="pb-2">
              <CardTitle class="text-sm text-muted-foreground">Shifts</CardTitle>
            </CardHeader>
            <CardContent class="text-2xl font-semibold">0</CardContent>
          </Card>
          <Card class="border-border bg-card/60">
            <CardHeader class="pb-2">
              <CardTitle class="text-sm text-muted-foreground">Stock faible</CardTitle>
            </CardHeader>
            <CardContent class="text-2xl font-semibold">0</CardContent>
          </Card>
          <Card class="border-border bg-card/60">
            <CardHeader class="pb-2">
              <CardTitle class="text-sm text-muted-foreground">Staff</CardTitle>
            </CardHeader>
            <CardContent class="text-2xl font-semibold">0</CardContent>
          </Card>
        </div>

        <div class="grid gap-4 lg:grid-cols-7">
          <Card class="border-border bg-card/60 lg:col-span-4">
            <CardHeader>
              <CardTitle class="text-base">Activité</CardTitle>
            </CardHeader>
            <CardContent class="text-sm text-muted-foreground">
              Placeholder graphique (sales by hour, etc.).
            </CardContent>
          </Card>
          <Card class="border-border bg-card/60 lg:col-span-3">
            <CardHeader>
              <CardTitle class="text-base">Derniers shifts</CardTitle>
            </CardHeader>
            <CardContent class="text-sm text-muted-foreground">
              Placeholder liste des shifts récents.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

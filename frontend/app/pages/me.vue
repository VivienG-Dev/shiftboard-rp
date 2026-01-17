<script setup lang="ts">
import { useAuth } from "~/composables/useAuth";
import { useCompanies } from "~/composables/useCompanies";

definePageMeta({
  middleware: "auth",
  ssr: false,
});

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AppNavbar from "@/components/AppNavbar.vue";
import type { Company } from "~/composables/useCompanies";
import { Building2, User } from "lucide-vue-next";

const { session, sessionPending, refreshSession } = useAuth();
const { listMyCompanies } = useCompanies();

const companies = ref<Company[]>([]);
const companiesLoading = ref(true);
const companiesError = ref<string | null>(null);

const user = computed(() => (session.value as any)?.user ?? null);
const userName = computed(() => String(user.value?.name ?? user.value?.displayName ?? "Utilisateur"));
const userEmail = computed(() => String(user.value?.email ?? ""));

const initials = computed(() => {
  const parts = userName.value.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  return letters || "SB";
});

async function loadCompanies() {
  companiesLoading.value = true;
  companiesError.value = null;
  try {
    const res = await listMyCompanies();
    companies.value = res.data ?? [];
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger tes entreprises.";
    companiesError.value = message;
  } finally {
    companiesLoading.value = false;
  }
}

async function refreshAll() {
  await Promise.all([refreshSession(), loadCompanies()]);
}

onMounted(async () => {
  if (!session.value) await refreshSession();
  await loadCompanies();
});
</script>

<template>
  <div class="relative min-h-screen bg-background text-foreground">
    <div
      class="pointer-events-none absolute inset-0 [background:radial-gradient(900px_circle_at_10%_15%,rgba(34,211,238,0.12),transparent_55%),radial-gradient(900px_circle_at_90%_80%,rgba(236,72,153,0.12),transparent_55%)]"
    />
    <AppNavbar
      title="Profil"
      subtitle="Ton compte + accès rapide à tes entreprises."
      mode="authed"
      :show-profile-link="false"
    />

    <main class="relative mx-auto w-full max-w-6xl space-y-6 px-6 py-10">
      <div class="grid gap-4 lg:grid-cols-3">
        <Card class="border-border bg-card/60 lg:col-span-1">
          <CardHeader class="space-y-1">
            <CardTitle class="flex items-center gap-2 text-lg">
              <User class="h-4 w-4" />
              Compte
            </CardTitle>
            <CardDescription>Infos de ta session.</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex items-center gap-4">
              <div
                class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-linear-to-tr from-cyan-400 to-pink-500 text-sm font-black text-slate-950"
              >
                {{ initials }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="truncate font-semibold">{{ userName }}</div>
                <div class="truncate text-sm text-muted-foreground">
                  {{ userEmail || "—" }}
                </div>
              </div>
            </div>

            <div class="mt-4 flex items-center justify-between gap-2 text-sm">
              <span class="text-muted-foreground">Statut</span>
              <span class="text-xs">
                {{ sessionPending ? "Chargement…" : "Connecté" }}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card class="border-border bg-card/60 lg:col-span-2">
          <CardHeader class="space-y-1">
            <CardTitle class="flex items-center gap-2 text-lg">
              <Building2 class="h-4 w-4" />
              Mes entreprises
            </CardTitle>
            <CardDescription>
              Accède directement au dashboard d’une entreprise.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div
              v-if="companiesError"
              class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200"
            >
              {{ companiesError }}
            </div>

            <div v-if="companiesLoading" class="grid gap-3 md:grid-cols-2">
              <Skeleton class="h-20 w-full" />
              <Skeleton class="h-20 w-full" />
              <Skeleton class="h-20 w-full" />
              <Skeleton class="h-20 w-full" />
            </div>

            <div
              v-else-if="companies.length === 0"
              class="rounded-xl border border-border bg-background/40 p-6 text-sm text-muted-foreground"
            >
              Aucune entreprise pour le moment. Crée-en une depuis la page Entreprises.
              <div class="mt-4">
                <NuxtLink to="/companies">
                  <Button
                    class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
                  >
                    Voir les entreprises
                  </Button>
                </NuxtLink>
              </div>
            </div>

            <div v-else class="grid gap-3 md:grid-cols-2">
              <NuxtLink
                v-for="c in companies"
                :key="c.id"
                :to="`/companies/${c.id}/dashboard`"
                class="rounded-xl border border-border bg-background/40 p-4 hover:bg-accent/30"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="truncate font-semibold">{{ c.name }}</div>
                    <div class="mt-1 text-xs text-muted-foreground">
                      {{ c.type }}
                      <span v-if="c.slug">• {{ c.slug }}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Ouvrir</Button>
                </div>
              </NuxtLink>
            </div>

            <div class="pt-2">
              <NuxtLink to="/companies">
                <Button variant="outline" class="w-full">Gérer mes entreprises</Button>
              </NuxtLink>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
</template>

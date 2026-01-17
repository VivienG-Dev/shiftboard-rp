<script setup lang="ts">
import { Button } from "@/components/ui/button";
import AppNavbar from "@/components/AppNavbar.vue";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  Package,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-vue-next";

definePageMeta({
  layout: "blank",
  ssr: false,
});
</script>

<template>
  <div class="flex h-full flex-col">
    <AppNavbar
      title="ShiftBoard RP"
      subtitle="Opérations de shift, organisées.">
      <template #actions="{ isAuthenticated, signOut }">
        <div
          class="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
          <a class="transition hover:text-foreground" href="#features"
            >Fonctionnalités</a
          >
          <a class="transition hover:text-foreground" href="#workflow"
            >Parcours</a
          >
          <a class="transition hover:text-foreground" href="#dashboard"
            >Dashboard</a
          >
        </div>
        <div class="flex items-center gap-2">
          <template v-if="isAuthenticated">
            <NuxtLink to="/companies">
              <Button variant="ghost">Entreprises</Button>
            </NuxtLink>
            <NuxtLink to="/me">
              <Button variant="ghost">Profil</Button>
            </NuxtLink>
            <Button variant="ghost" @click="signOut">Déconnexion</Button>
          </template>
          <template v-else>
            <NuxtLink to="/sign-in">
              <Button variant="ghost">Connexion</Button>
            </NuxtLink>
            <NuxtLink to="/sign-up">
              <Button
                class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400">
                Démarrer
              </Button>
            </NuxtLink>
          </template>
        </div>
      </template>
    </AppNavbar>

    <main
      class="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-24 pt-10">
      <section
        class="relative overflow-hidden rounded-[36px] border border-border/70 bg-background/70 px-6 pb-14 pt-10 shadow-[0_40px_120px_-90px_rgba(15,23,42,0.9)]">
        <div
          class="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(148,163,184,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.2)_1px,transparent_1px)] [background-size:140px_140px]" />
        <div
          class="pointer-events-none absolute -top-32 left-1/2 h-60 w-[36rem] -translate-x-1/2 rounded-full bg-cyan-400/15 blur-[120px]" />
        <div
          class="pointer-events-none absolute -bottom-24 right-10 h-52 w-72 rounded-full bg-pink-500/15 blur-[120px]" />

        <div
          class="relative mx-auto flex max-w-4xl flex-col items-center text-center">
          <div
            class="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-1 text-xs text-muted-foreground">
            <Sparkles class="h-3.5 w-3.5 text-cyan-300" />
            Nouveau • Dashboard RP optimisé pour les shifts
          </div>

          <h1 class="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
            L’outil qui structure vos opérations RP, sans friction.
          </h1>
          <p class="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            ShiftBoard RP centralise inventaire, ventes et équipe pour chaque
            entreprise. Parfait pour les bars GTA V RP qui veulent rester
            carrés.
          </p>

          <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
            <NuxtLink to="/sign-up">
              <Button
                class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400">
                Démarrer maintenant
                <ArrowRight class="ml-2 h-4 w-4" />
              </Button>
            </NuxtLink>
            <NuxtLink to="/sign-in">
              <Button variant="outline">Connexion</Button>
            </NuxtLink>
          </div>

          <div
            class="mt-8 inline-flex flex-wrap items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
            <span
              class="rounded-full bg-background px-3 py-1 text-foreground shadow-sm">
              Tableau de bord
            </span>
            <span class="rounded-full px-3 py-1">Inventaire</span>
            <span class="rounded-full px-3 py-1">Sales cards</span>
            <span class="rounded-full px-3 py-1">Équipe</span>
            <span class="rounded-full px-3 py-1">Stats</span>
          </div>
        </div>

        <div class="relative mt-12">
          <div
            class="rounded-[28px] border border-border bg-card/70 p-4 shadow-[0_30px_90px_-70px_rgba(15,23,42,0.85)]">
            <div
              class="mt-4 overflow-hidden rounded-2xl border border-border/70 bg-background/70">
              <img
                src="/images/app-preview.svg"
                alt="Aperçu de l'application ShiftBoard RP"
                class="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section id="features" class="mt-16 grid gap-6 lg:grid-cols-3">
        <div class="rounded-3xl border border-border bg-card/60 p-6">
          <div
            class="flex items-center gap-3 text-sm font-semibold text-foreground">
            <Package class="h-4 w-4 text-cyan-300" />
            Inventaire sans effort
          </div>
          <p class="mt-3 text-sm text-muted-foreground">
            Snapshots rapides, stock clair, restocks planifiés. Chaque produit
            reste sous contrôle même en pleine nuit.
          </p>
        </div>
        <div class="rounded-3xl border border-border bg-card/60 p-6">
          <div
            class="flex items-center gap-3 text-sm font-semibold text-foreground">
            <ClipboardList class="h-4 w-4 text-pink-300" />
            Sales cards propres
          </div>
          <p class="mt-3 text-sm text-muted-foreground">
            Les ventes se structurent par shift, avec validation admin et un
            historique facilement consultable.
          </p>
        </div>
        <div class="rounded-3xl border border-border bg-card/60 p-6">
          <div
            class="flex items-center gap-3 text-sm font-semibold text-foreground">
            <Users class="h-4 w-4 text-cyan-200" />
            Rôles qui protègent
          </div>
          <p class="mt-3 text-sm text-muted-foreground">
            Assignez les accès, archivez les anciens membres, gardez un staff
            toujours à jour.
          </p>
        </div>
      </section>

      <section
        id="workflow"
        class="mt-14 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div class="rounded-3xl border border-border bg-card/60 p-6">
          <div
            class="flex items-center gap-3 text-sm font-semibold text-foreground">
            <ShieldCheck class="h-4 w-4 text-pink-300" />
            Workflow RP clair
          </div>
          <p class="mt-3 text-sm text-muted-foreground">
            Un parcours simple et logique pour chaque entreprise, du setup
            initial jusqu’au suivi du cash.
          </p>
          <div class="mt-6 space-y-3 text-sm text-muted-foreground">
            <div
              class="rounded-2xl border border-border/70 bg-background/60 p-4">
              1. Créez l’entreprise et importez vos produits.
            </div>
            <div
              class="rounded-2xl border border-border/70 bg-background/60 p-4">
              2. Ajoutez l’équipe, définissez les rôles, lancez le shift.
            </div>
            <div
              class="rounded-2xl border border-border/70 bg-background/60 p-4">
              3. Vérifiez le stock, validez la vente, consultez les stats.
            </div>
          </div>
        </div>
        <div
          id="dashboard"
          class="rounded-3xl border border-border bg-card/60 p-6">
          <div
            class="flex items-center gap-3 text-sm font-semibold text-foreground">
            <BarChart3 class="h-4 w-4 text-cyan-300" />
            Stats prêtes pour les admins
          </div>
          <p class="mt-3 text-sm text-muted-foreground">
            Heures, jours, mois : tout est filtrable pour comprendre les pics
            d’activité et réagir vite.
          </p>
          <div class="mt-6 grid gap-3 sm:grid-cols-2">
            <div
              class="rounded-2xl border border-border/70 bg-background/60 p-4">
              <div class="text-xs text-muted-foreground">Heures</div>
              <div class="mt-2 text-lg font-semibold text-foreground">
                Courbes propres
              </div>
            </div>
            <div
              class="rounded-2xl border border-border/70 bg-background/60 p-4">
              <div class="text-xs text-muted-foreground">Mois</div>
              <div class="mt-2 text-lg font-semibold text-foreground">
                Comparatif immédiat
              </div>
            </div>
            <div
              class="rounded-2xl border border-border/70 bg-background/60 p-4">
              <div class="text-xs text-muted-foreground">Équipe</div>
              <div class="mt-2 text-lg font-semibold text-foreground">
                Rôles suivis
              </div>
            </div>
            <div
              class="rounded-2xl border border-border/70 bg-background/60 p-4">
              <div class="text-xs text-muted-foreground">Shifts</div>
              <div class="mt-2 text-lg font-semibold text-foreground">
                Résultats par jour
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="mt-12 rounded-3xl border border-border bg-card/60 p-6">
        <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div class="space-y-3">
            <div class="text-sm font-semibold text-foreground">
              Prêt à lancer votre équipe ?
            </div>
            <p class="text-sm text-muted-foreground">
              Configurez un bar, ajoutez vos responsables, puis suivez les
              shifts en direct. Tout est pensé pour rester fluide en RP.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3 lg:justify-end">
            <NuxtLink to="/sign-up">
              <Button
                class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400">
                Créer un compte
              </Button>
            </NuxtLink>
            <NuxtLink to="/sign-in">
              <Button variant="outline">Se connecter</Button>
            </NuxtLink>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

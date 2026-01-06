<script setup lang="ts">
import { useAuth } from "~/composables/useAuth";
import { Button } from "@/components/ui/button";

definePageMeta({
  layout: "blank",
  ssr: false,
});

const { isAuthenticated, session, signOut } = useAuth();
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col px-6">
    <header class="flex items-center justify-between py-6">
      <NuxtLink to="/" class="flex items-center gap-3 hover:opacity-95">
        <div
          class="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-tr from-cyan-400 to-pink-500 text-xs font-black text-slate-950">
          SB
        </div>
        <div>
          <div class="text-sm font-semibold tracking-tight">ShiftBoard RP</div>
          <div class="text-xs text-muted-foreground">
            Opérations de shift, organisées.
          </div>
        </div>
      </NuxtLink>

      <div v-if="isAuthenticated" class="flex items-center gap-2">
        <NuxtLink to="/companies">
          <Button variant="ghost">Entreprises</Button>
        </NuxtLink>
        <NuxtLink to="/me">
          <Button variant="ghost">Profil</Button>
        </NuxtLink>
        <Button variant="ghost" @click="signOut">Déconnexion</Button>
      </div>

      <div v-else class="flex items-center gap-2">
        <NuxtLink to="/sign-in">
          <Button variant="ghost">Connexion</Button>
        </NuxtLink>
        <NuxtLink to="/sign-up">
          <Button
            class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400">
            Créer un compte
          </Button>
        </NuxtLink>
      </div>
    </header>

    <main class="flex-1 pb-12 pt-10">
      <div class="grid items-center gap-10 lg:grid-cols-2">
        <div class="space-y-6">
          <h1 class="text-4xl font-bold tracking-tight md:text-5xl">
            Gérez votre bar comme une entreprise.
          </h1>
          <p class="max-w-xl text-muted-foreground">
            Suivez l’inventaire, les shifts et l’équipe sur plusieurs
            entreprises — pensé pour les communautés GTA V RP.
          </p>

          <div class="flex flex-wrap items-center gap-3">
            <NuxtLink to="/sign-in">
              <Button
                class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400">
                Connexion
              </Button>
            </NuxtLink>
            <NuxtLink to="/sign-up">
              <Button variant="outline">Créer un compte</Button>
            </NuxtLink>
          </div>

          <div
            v-if="isAuthenticated"
            class="rounded-xl border border-border bg-card/60 p-4">
            <div class="text-xs text-muted-foreground">Connecté</div>
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <NuxtLink to="/companies">
                <Button variant="secondary">Voir mes entreprises</Button>
              </NuxtLink>
              <NuxtLink to="/me">
                <Button variant="outline">Profil</Button>
              </NuxtLink>
              <Button variant="ghost" @click="signOut">Déconnexion</Button>
            </div>
            <pre
              class="mt-3 max-h-40 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground"
              >{{ session }}</pre
            >
          </div>
        </div>

        <div class="relative hidden lg:block">
          <div
            class="absolute -inset-8 rounded-4xl bg-linear-to-tr from-cyan-400/20 via-slate-950/10 to-pink-500/20 blur-2xl" />
          <div
            class="relative overflow-hidden rounded-2xl border border-border bg-card/50">
            <div
              class="absolute inset-0 bg-[url('/images/ls-skyline.svg')] bg-cover bg-center opacity-70" />
            <div
              class="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div class="relative p-8">
              <div class="text-sm font-semibold tracking-wide text-slate-200">
                Shift de nuit à Los Santos
              </div>
              <div class="mt-2 text-xs text-muted-foreground">
                Gardez les bouteilles comptées, les shifts enregistrés, et la
                caisse maîtrisée.
              </div>
            </div>
            <div class="relative px-8 pb-8 pt-2">
              <div class="grid gap-3 md:grid-cols-3">
                <div class="rounded-xl border border-border bg-card/60 p-4">
                  <div class="text-xs text-muted-foreground">Inventaire</div>
                  <div class="mt-1 text-lg font-semibold">Snapshots</div>
                </div>
                <div class="rounded-xl border border-border bg-card/60 p-4">
                  <div class="text-xs text-muted-foreground">Shifts</div>
                  <div class="mt-1 text-lg font-semibold">Cards</div>
                </div>
                <div class="rounded-xl border border-border bg-card/60 p-4">
                  <div class="text-xs text-muted-foreground">Équipe</div>
                  <div class="mt-1 text-lg font-semibold">Rôles</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

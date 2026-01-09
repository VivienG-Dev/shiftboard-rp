<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useAuth } from "~/composables/useAuth";

type NavbarMode = "public" | "authed";

const props = withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    mode?: NavbarMode;
    showProfileLink?: boolean;
    showCompaniesLink?: boolean;
  }>(),
  {
    subtitle: undefined,
    mode: "public",
    showProfileLink: true,
    showCompaniesLink: true,
  }
);

const { isAuthenticated, signOut } = useAuth();

const showAuthedActions = computed(
  () => props.mode === "authed" || isAuthenticated.value
);
</script>

<template>
  <header class="bg-transparent pb-6 pt-6">
    <div class="mx-auto w-full max-w-6xl px-6">
      <div
        class="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background/80 px-5 py-3 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.9)] backdrop-blur"
      >
      <NuxtLink to="/" class="flex items-center gap-3 hover:opacity-95">
        <div
          class="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-tr from-cyan-400 to-pink-500 text-xs font-black text-slate-950"
        >
          SB
        </div>
        <div>
          <div class="text-sm font-semibold tracking-tight">{{ title }}</div>
          <div v-if="subtitle" class="text-xs text-muted-foreground">
            {{ subtitle }}
          </div>
        </div>
      </NuxtLink>

      <div class="flex items-center gap-2">
        <slot name="actions" :is-authenticated="isAuthenticated" :sign-out="signOut">
          <template v-if="showAuthedActions">
            <NuxtLink v-if="showCompaniesLink" to="/companies">
              <Button variant="ghost">Entreprises</Button>
            </NuxtLink>
            <NuxtLink v-if="showProfileLink" to="/me">
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
                class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
              >
                Créer un compte
              </Button>
            </NuxtLink>
          </template>
        </slot>
      </div>
      </div>
    </div>
  </header>
</template>

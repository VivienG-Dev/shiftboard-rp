<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Building2, LogIn, LogOut, Menu, UserPlus, User, X } from "lucide-vue-next";
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

const isMobileMenuOpen = ref(false);
const route = useRoute();

watch(
  () => route.fullPath,
  () => {
    isMobileMenuOpen.value = false;
  }
);
</script>

<template>
  <header class="bg-transparent pb-6 pt-6">
    <div class="mx-auto w-full max-w-6xl px-6">
      <div
        class="relative flex flex-col gap-4 rounded-2xl border border-border bg-background/80 px-5 py-3 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.9)] backdrop-blur sm:flex-row sm:items-center sm:justify-between"
      >
      <div class="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
        <NuxtLink to="/" class="flex min-w-0 items-center gap-3 hover:opacity-95">
          <div
            class="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-tr from-cyan-400 to-pink-500 text-xs font-black text-slate-950"
          >
            SB
          </div>
          <div>
            <div class="text-sm font-semibold tracking-tight">{{ title }}</div>
            <div v-if="subtitle" class="hidden text-xs text-muted-foreground sm:block">
              {{ subtitle }}
            </div>
          </div>
        </NuxtLink>

        <Button
          variant="ghost"
          class="sm:hidden"
          :aria-expanded="isMobileMenuOpen"
          aria-label="Ouvrir le menu"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <Menu v-if="!isMobileMenuOpen" class="h-5 w-5" />
          <X v-else class="h-5 w-5" />
        </Button>
      </div>

      <Teleport to="body">
        <Transition
          enter-active-class="transition-opacity duration-150"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-150"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="isMobileMenuOpen"
            class="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm sm:hidden"
          />
        </Transition>
      </Teleport>

      <div class="hidden sm:block">
        <div
          class="rounded-2xl border border-border bg-background/90 p-3 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.9)] backdrop-blur sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-0"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
            <slot name="actions" :is-authenticated="isAuthenticated" :sign-out="signOut">
              <template v-if="showAuthedActions">
                <NuxtLink v-if="showCompaniesLink" to="/companies">
                  <Button variant="ghost" class="w-full text-base sm:w-auto sm:text-sm">
                    Entreprises
                  </Button>
                </NuxtLink>
                <NuxtLink v-if="showProfileLink" to="/me">
                  <Button variant="ghost" class="w-full text-base sm:w-auto sm:text-sm">
                    Profil
                  </Button>
                </NuxtLink>
                <Button
                  variant="ghost"
                  class="w-full text-base sm:w-auto sm:text-sm"
                  @click="signOut()"
                >
                  Déconnexion
                </Button>
              </template>
              <template v-else>
                <NuxtLink to="/sign-in">
                  <Button variant="ghost" class="w-full text-base sm:w-auto sm:text-sm">
                    Connexion
                  </Button>
                </NuxtLink>
                <NuxtLink to="/sign-up">
                  <Button
                    class="w-full text-base bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400 sm:w-auto sm:text-sm"
                  >
                    Créer un compte
                  </Button>
                </NuxtLink>
              </template>
            </slot>
          </div>
        </div>
      </div>

      <Teleport to="body">
        <Transition
          enter-active-class="transition-opacity duration-150"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-150"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="isMobileMenuOpen"
            class="fixed inset-0 z-50 flex flex-col gap-6 bg-slate-950/20 px-6 pb-10 pt-6 text-white backdrop-blur sm:hidden"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-tr from-cyan-400 to-pink-500 text-xs font-black text-slate-950"
                >
                  SB
                </div>
                <div>
                  <div class="text-sm font-semibold tracking-tight">{{ title }}</div>
                  <div v-if="subtitle" class="hidden text-xs text-white/60 sm:block">
                    {{ subtitle }}
                  </div>
                </div>
              </div>
              <button
                type="button"
                class="rounded-full p-2 text-white/80 transition hover:text-white"
                aria-label="Fermer le menu"
                @click="isMobileMenuOpen = false"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <div class="flex flex-col gap-2 pt-4">
              <template v-if="showAuthedActions">
                <NuxtLink v-if="showCompaniesLink" to="/companies" class="group">
                  <div class="flex items-center gap-3 rounded-xl px-3 py-3 text-lg font-semibold transition hover:bg-white/10">
                    <Building2 class="h-5 w-5 text-white/70 group-hover:text-white" />
                    Entreprises
                  </div>
                </NuxtLink>
                <NuxtLink v-if="showProfileLink" to="/me" class="group">
                  <div class="flex items-center gap-3 rounded-xl px-3 py-3 text-lg font-semibold transition hover:bg-white/10">
                    <User class="h-5 w-5 text-white/70 group-hover:text-white" />
                    Profil
                  </div>
                </NuxtLink>
                <button
                  type="button"
                  class="flex items-center gap-3 rounded-xl px-3 py-3 text-lg font-semibold transition hover:bg-white/10"
                  @click="signOut()"
                >
                  <LogOut class="h-5 w-5 text-white/70" />
                  Déconnexion
                </button>
              </template>
              <template v-else>
                <NuxtLink to="/sign-in" class="group">
                  <div class="flex items-center gap-3 rounded-xl px-3 py-3 text-lg font-semibold transition hover:bg-white/10">
                    <LogIn class="h-5 w-5 text-white/70 group-hover:text-white" />
                    Connexion
                  </div>
                </NuxtLink>
                <NuxtLink to="/sign-up" class="group">
                  <div class="flex items-center gap-3 rounded-xl px-3 py-3 text-lg font-semibold transition hover:bg-white/10">
                    <UserPlus class="h-5 w-5 text-white/70 group-hover:text-white" />
                    Créer un compte
                  </div>
                </NuxtLink>
              </template>
            </div>
          </div>
        </Transition>
      </Teleport>
      </div>
    </div>
  </header>
</template>

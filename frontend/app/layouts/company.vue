<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Building2,
  Camera,
  LayoutDashboard,
  LogOut,
  MapPin,
  Moon,
  Package,
  Boxes,
  Sun,
  User,
  ClipboardList,
  Users,
  Truck,
} from "lucide-vue-next";
import { useAuth } from "~/composables/useAuth";
import { useCompanies } from "~/composables/useCompanies";

const route = useRoute();
const companyId = computed(() => String(route.params.companyId ?? ""));

const { signOut } = useAuth();
const { getCompany } = useCompanies();
const colorMode = useColorMode();

const companyName = ref<string>("Entreprise");
const loadingCompany = ref(true);

async function loadCompany() {
  if (!companyId.value) return;
  loadingCompany.value = true;
  try {
    const res = await getCompany(companyId.value);
    companyName.value = res.data?.name ?? "Entreprise";
  } catch {
    companyName.value = "Entreprise";
  } finally {
    loadingCompany.value = false;
  }
}

watchEffect(() => {
  if (companyId.value) loadCompany();
});

function isActive(path: string) {
  const current = route.path.replace(/\/$/, "");
  const target = path.replace(/\/$/, "");
  return current === target || current.startsWith(`${target}/`);
}

function navLinkClass(active: boolean) {
  return [
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
    active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/40",
  ].join(" ");
}

const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <div class="flex min-h-screen">
      <aside class="w-full border-b border-border bg-card/60 lg:w-72 lg:border-b-0 lg:border-r">
        <div class="flex h-full flex-col">
          <div class="flex items-center justify-between gap-3 px-5 py-5">
            <NuxtLink :to="`/companies/${companyId}/dashboard`" class="flex min-w-0 items-center gap-3">
              <div
                class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-cyan-400 to-pink-500 text-xs font-black text-slate-950">
                SB
              </div>
              <div class="min-w-0">
                <div class="truncate text-sm font-semibold tracking-tight">
                  <span v-if="loadingCompany">Chargement…</span>
                  <span v-else>{{ companyName }}</span>
                </div>
                <div class="text-xs text-muted-foreground">Company dashboard</div>
              </div>
            </NuxtLink>
          </div>

          <div class="px-3 pb-4">
            <div class="px-3 pb-2 text-xs font-semibold tracking-wide text-muted-foreground">
              Navigation
            </div>
            <nav class="space-y-1">
              <NuxtLink
                :to="`/companies/${companyId}/dashboard`"
                :class="navLinkClass(isActive(`/companies/${companyId}/dashboard`))"
              >
                <LayoutDashboard class="h-4 w-4" />
                <span>Aperçu</span>
              </NuxtLink>
              <NuxtLink
                :to="`/companies/${companyId}/locations`"
                :class="navLinkClass(isActive(`/companies/${companyId}/locations`))"
              >
                <MapPin class="h-4 w-4" />
                <span>Lieux</span>
              </NuxtLink>
              <NuxtLink
                :to="`/companies/${companyId}/items`"
                :class="navLinkClass(isActive(`/companies/${companyId}/items`))"
              >
                <Package class="h-4 w-4" />
                <span>Inventaire</span>
              </NuxtLink>
              <NuxtLink
                :to="`/companies/${companyId}/stock`"
                :class="navLinkClass(isActive(`/companies/${companyId}/stock`))"
              >
                <Boxes class="h-4 w-4" />
                <span>Stock</span>
              </NuxtLink>
              <NuxtLink
                :to="`/companies/${companyId}/snapshots`"
                :class="navLinkClass(isActive(`/companies/${companyId}/snapshots`))"
              >
                <Camera class="h-4 w-4" />
                <span>Snapshots</span>
              </NuxtLink>
              <NuxtLink
                :to="`/companies/${companyId}/restocks`"
                :class="navLinkClass(isActive(`/companies/${companyId}/restocks`))"
              >
                <Truck class="h-4 w-4" />
                <span>Restocks</span>
              </NuxtLink>
              <NuxtLink
                :to="`/companies/${companyId}/shifts`"
                :class="navLinkClass(isActive(`/companies/${companyId}/shifts`))"
              >
                <ClipboardList class="h-4 w-4" />
                <span>Shifts</span>
              </NuxtLink>
              <NuxtLink
                :to="`/companies/${companyId}/team`"
                :class="navLinkClass(isActive(`/companies/${companyId}/team`))"
              >
                <Users class="h-4 w-4" />
                <span>Équipe</span>
              </NuxtLink>

              <div class="pt-3">
                <div class="px-3 pb-2 text-xs font-semibold tracking-wide text-muted-foreground">
                  Bientôt
                </div>
                <div class="space-y-1">
                </div>
              </div>
            </nav>
          </div>

          <div class="mt-auto border-t border-border px-3 py-3">
            <div class="flex items-center gap-2 px-2">
              <NuxtLink to="/companies" class="flex-1">
                <Button variant="ghost" class="w-full justify-start">
                  <Building2 class="mr-2 h-4 w-4" />
                  Entreprises
                </Button>
              </NuxtLink>
              <NuxtLink to="/me" class="flex-1">
                <Button variant="ghost" class="w-full justify-start">
                  <User class="mr-2 h-4 w-4" />
                  Profil
                </Button>
              </NuxtLink>
            </div>
            <div class="mt-2 px-2">
              <Button variant="ghost" class="w-full justify-start" @click="signOut">
                <LogOut class="mr-2 h-4 w-4" />
                Déconnexion
              </Button>
            </div>
            <div class="mt-2 px-2">
              <Button
                variant="ghost"
                class="w-full justify-start"
                @click="toggleTheme"
                :aria-label="`Basculer en mode ${colorMode.value === 'dark' ? 'clair' : 'sombre'}`"
              >
                <Sun v-if="colorMode.value === 'dark'" class="h-4 w-4" />
                <Moon v-else class="h-4 w-4" />
                <span class="ml-2">
                  {{ colorMode.value === "dark" ? "Mode clair" : "Mode sombre" }}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <main class="flex-1">
        <div class="p-6 lg:p-8">
          <NuxtPage />
        </div>
      </main>
    </div>
  </div>
</template>

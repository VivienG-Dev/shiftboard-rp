<script setup lang="ts">
import {
  Building2,
  Camera,
  LayoutDashboard,
  LogOut,
  MapPin,
  Moon,
  Package,
  Boxes,
  Settings,
  Sun,
  User,
  ClipboardList,
  FileText,
  Users,
  Truck,
} from "lucide-vue-next";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
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

const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};
</script>

<template>
  <SidebarProvider class="bg-background text-foreground">
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div class="flex items-center gap-2 px-1">
          <SidebarTrigger class="hidden md:flex" />
          <div class="min-w-0 flex-1" />
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              as-child
              size="lg"
              :is-active="isActive(`/companies/${companyId}/dashboard`)"
              tooltip="Aperçu">
              <NuxtLink
                :to="`/companies/${companyId}/dashboard`"
                class="flex items-center gap-3">
                <div
                  class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-linear-to-tr from-cyan-400 to-pink-500 text-xs font-black text-slate-950">
                  SB
                </div>
                <div class="min-w-0">
                  <template v-if="loadingCompany">
                    <div class="space-y-1">
                      <Skeleton class="h-4 w-32" />
                      <Skeleton class="h-3 w-24" />
                    </div>
                  </template>
                  <template v-else>
                    <div class="truncate text-sm font-semibold tracking-tight">
                      {{ companyName }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      Company dashboard
                    </div>
                  </template>
                </div>
              </NuxtLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  as-child
                  :is-active="isActive(`/companies/${companyId}/dashboard`)"
                  tooltip="Aperçu">
                  <NuxtLink :to="`/companies/${companyId}/dashboard`">
                    <LayoutDashboard />
                    <span>Aperçu</span>
                  </NuxtLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  as-child
                  :is-active="isActive(`/companies/${companyId}/locations`)"
                  tooltip="Lieux">
                  <NuxtLink :to="`/companies/${companyId}/locations`">
                    <MapPin />
                    <span>Lieux</span>
                  </NuxtLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  as-child
                  :is-active="isActive(`/companies/${companyId}/items`)"
                  tooltip="Inventaire">
                  <NuxtLink :to="`/companies/${companyId}/items`">
                    <Package />
                    <span>Inventaire</span>
                  </NuxtLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  as-child
                  :is-active="isActive(`/companies/${companyId}/stock`)"
                  tooltip="Stock">
                  <NuxtLink :to="`/companies/${companyId}/stock`">
                    <Boxes />
                    <span>Stock</span>
                  </NuxtLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  as-child
                  :is-active="isActive(`/companies/${companyId}/snapshots`)"
                  tooltip="Snapshots">
                  <NuxtLink :to="`/companies/${companyId}/snapshots`">
                    <Camera />
                    <span>Snapshots</span>
                  </NuxtLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  as-child
                  :is-active="isActive(`/companies/${companyId}/restocks`)"
                  tooltip="Restocks">
                  <NuxtLink :to="`/companies/${companyId}/restocks`">
                    <Truck />
                    <span>Restocks</span>
                  </NuxtLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  as-child
                  :is-active="isActive(`/companies/${companyId}/shifts`)"
                  tooltip="Shifts">
                  <NuxtLink :to="`/companies/${companyId}/shifts`">
                    <ClipboardList />
                    <span>Shifts</span>
                  </NuxtLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  as-child
                  :is-active="isActive(`/companies/${companyId}/sales-cards`)"
                  tooltip="Rapports">
                  <NuxtLink :to="`/companies/${companyId}/sales-cards`">
                    <FileText />
                    <span>Rapports</span>
                  </NuxtLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  as-child
                  :is-active="isActive(`/companies/${companyId}/team`)"
                  tooltip="Équipe">
                  <NuxtLink :to="`/companies/${companyId}/team`">
                    <Users />
                    <span>Équipe</span>
                  </NuxtLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  as-child
                  :is-active="isActive(`/companies/${companyId}/settings`)"
                  tooltip="Paramètres">
                  <NuxtLink :to="`/companies/${companyId}/settings`">
                    <Settings />
                    <span>Paramètres</span>
                  </NuxtLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton as-child tooltip="Entreprises">
              <NuxtLink to="/companies">
                <Building2 />
                <span>Entreprises</span>
              </NuxtLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton as-child tooltip="Profil">
              <NuxtLink to="/me">
                <User />
                <span>Profil</span>
              </NuxtLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Mode clair / sombre"
              @click="toggleTheme"
              :aria-label="`Basculer en mode ${
                colorMode.value === 'dark' ? 'clair' : 'sombre'
              }`">
              <Sun v-if="colorMode.value === 'dark'" />
              <Moon v-else />
              <span>{{
                colorMode.value === "dark" ? "Mode clair" : "Mode sombre"
              }}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Déconnexion" @click="signOut">
              <LogOut />
              <span>Déconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>

    <SidebarInset>
      <div
        class="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/80 px-3 py-2 backdrop-blur md:hidden">
        <SidebarTrigger />
        <div class="min-w-0 truncate text-sm font-semibold">
          <Skeleton v-if="loadingCompany" class="h-4 w-40" />
          <span v-else>{{ companyName }}</span>
        </div>
      </div>

      <div class="p-6 lg:p-8">
        <NuxtPage />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

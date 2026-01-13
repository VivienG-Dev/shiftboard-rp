<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCompanyTeam } from "~/composables/useCompanyTeam";
import type { CompanyRole } from "~/composables/useCompanyTeam";
import { Archive, Pencil, Shield, Loader2 } from "lucide-vue-next";

definePageMeta({
  middleware: "auth",
  layout: "company",
  ssr: false,
});

const route = useRoute();
const companyId = computed(() => String(route.params.companyId));

const { listRoles, createRole, updateRole, archiveRole } = useCompanyTeam();

const roles = ref<CompanyRole[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const isSaving = ref(false);
const isArchiving = ref(false);
const archiveDialogOpen = ref(false);
const roleToArchive = ref<CompanyRole | null>(null);

const editingRoleId = ref<string | null>(null);
const name = ref("");
const key = ref("");
const permissions = ref<string[]>([]);

const permissionOptions = [
  { key: "company.read", label: "Lire l'entreprise" },
  { key: "company.update", label: "Modifier l'entreprise" },
  { key: "company.archive", label: "Archiver l'entreprise" },
  { key: "members.read", label: "Lire les membres" },
  { key: "members.invite", label: "Inviter des membres" },
  { key: "members.updateRole", label: "Gérer les rôles des membres" },
  { key: "roles.manage", label: "Gérer les rôles" },
  { key: "inventory.read", label: "Lire l'inventaire" },
  { key: "inventory.write", label: "Écrire l'inventaire" },
  { key: "inventory.snapshot.create", label: "Créer des snapshots" },
  { key: "salesCards.read", label: "Lire les shifts" },
  { key: "salesCards.create", label: "Créer des shifts" },
  { key: "salesCards.edit.ownDraft", label: "Modifier ses drafts" },
  { key: "salesCards.edit.anyUnlocked", label: "Modifier tous les drafts" },
  { key: "salesCards.stop.ownDraft", label: "Arrêter ses shifts" },
  { key: "salesCards.stop.anyDraft", label: "Arrêter tous les shifts" },
  { key: "salesCards.lock", label: "Verrouiller les shifts" },
  { key: "stats.read", label: "Lire les stats" },
];

const permissionLabels = new Map(permissionOptions.map((option) => [option.key, option.label]));

function labelForPermission(key: string) {
  return permissionLabels.get(key) ?? key;
}

function resetForm() {
  editingRoleId.value = null;
  name.value = "";
  key.value = "";
  permissions.value = [];
}

function startEdit(role: CompanyRole) {
  editingRoleId.value = role.id;
  name.value = role.name ?? "";
  key.value = role.key ?? "";
  permissions.value = role.permissions ? [...role.permissions] : [];
}

async function refresh() {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const res = await listRoles(companyId.value);
    roles.value = res.data ?? [];
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger les rôles.";
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
}

async function onSubmit() {
  errorMessage.value = null;
  successMessage.value = null;
  isSaving.value = true;
  try {
    if (editingRoleId.value) {
      await updateRole(companyId.value, editingRoleId.value, {
        name: name.value.trim(),
        permissions: permissions.value,
      });
      successMessage.value = "Rôle mis à jour.";
    } else {
      await createRole(companyId.value, {
        name: name.value.trim(),
        key: key.value.trim() || undefined,
        permissions: permissions.value,
      });
      successMessage.value = "Rôle créé.";
    }
    resetForm();
    await refresh();
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible d'enregistrer le rôle.";
    errorMessage.value = message;
  } finally {
    isSaving.value = false;
  }
}

async function onArchive() {
  if (!roleToArchive.value) return;
  isArchiving.value = true;
  try {
    await archiveRole(companyId.value, roleToArchive.value.id);
    roleToArchive.value = null;
    archiveDialogOpen.value = false;
    await refresh();
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible d'archiver le rôle.";
    errorMessage.value = message;
  } finally {
    isArchiving.value = false;
  }
}

onMounted(refresh);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Shield class="h-6 w-6" />
          Rôles
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Crée et gère les permissions des rôles de l’entreprise.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <NuxtLink :to="`/companies/${companyId}/team/members`">
          <Button variant="outline">Membres</Button>
        </NuxtLink>
        <NuxtLink :to="`/companies/${companyId}/team/invites`">
          <Button variant="outline">Invitations</Button>
        </NuxtLink>
      </div>
    </div>

    <div v-if="errorMessage" class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" class="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200">
      {{ successMessage }}
    </div>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">
          {{ editingRoleId ? "Modifier un rôle" : "Créer un rôle" }}
        </CardTitle>
        <CardDescription>Définis le nom, la clé et les permissions.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-sm font-medium">Nom</label>
            <Input v-model="name" placeholder="Ex: Bartender" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Clé (optionnel)</label>
            <Input v-model="key" :disabled="Boolean(editingRoleId)" placeholder="Ex: bartender" />
            <p class="text-xs text-muted-foreground">Uniquement à la création.</p>
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-sm font-medium">Permissions</div>
          <div class="grid gap-3 md:grid-cols-2">
            <label
              v-for="perm in permissionOptions"
              :key="perm.key"
              class="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <input
                v-model="permissions"
                type="checkbox"
                :value="perm.key"
                class="h-4 w-4"
              />
              {{ perm.label }}
            </label>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Button
            class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
            :disabled="isSaving || !name.trim()"
            @click="onSubmit"
          >
            <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
            {{ editingRoleId ? "Enregistrer" : "Créer" }}
          </Button>
          <Button variant="ghost" :disabled="isSaving" @click="resetForm">Annuler</Button>
        </div>
      </CardContent>
    </Card>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">Rôles existants</CardTitle>
        <CardDescription>Rôles actifs et permissions.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <div v-if="isLoading" class="text-sm text-muted-foreground">Chargement…</div>
        <div v-else-if="roles.length === 0" class="text-sm text-muted-foreground">
          Aucun rôle.
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="role in roles"
            :key="role.id"
            class="rounded-xl border border-border bg-background/40 p-4"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <div class="font-semibold">{{ role.name }}</div>
                  <span
                    v-if="role.isSystem"
                    class="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    Système
                  </span>
                </div>
                <div class="text-xs text-muted-foreground">Clé: {{ role.key }}</div>
              </div>
              <div class="flex items-center gap-2">
                <Button variant="outline" size="sm" @click="startEdit(role)">
                  <Pencil class="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="role.isSystem"
                  @click="roleToArchive = role; archiveDialogOpen = true"
                >
                  <Archive class="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="perm in role.permissions ?? []"
                :key="perm"
                class="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {{ labelForPermission(perm) }}
              </span>
              <span
                v-if="!role.permissions || role.permissions.length === 0"
                class="text-xs text-muted-foreground"
              >
                Aucune permission
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>

  <AlertDialog :open="archiveDialogOpen" @update:open="archiveDialogOpen = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Archiver ce rôle ?</AlertDialogTitle>
        <AlertDialogDescription>
          Le rôle ne sera plus assignable aux membres.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isArchiving">Annuler</AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          :disabled="isArchiving"
          @click="onArchive"
        >
          <Loader2 v-if="isArchiving" class="mr-2 h-4 w-4 animate-spin" />
          Archiver
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

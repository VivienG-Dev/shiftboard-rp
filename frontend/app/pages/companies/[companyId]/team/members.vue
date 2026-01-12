<script setup lang="ts">
definePageMeta({
  middleware: "auth",
  layout: "company",
  ssr: false,
});

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
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
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCompanyTeam } from "~/composables/useCompanyTeam";
import type { MemberRow, MyMembership } from "~/composables/useCompanyTeam";
import { Users, X, UserMinus } from "lucide-vue-next";

const route = useRoute();
const companyId = computed(() => String(route.params.companyId));

const {
  getMyMembership,
  updateMyMembership,
  listMembers,
  listRoles,
  updateMember,
  addMemberRole,
  removeMemberRole,
  archiveMember,
} = useCompanyTeam();

const me = ref<MyMembership | null>(null);
const members = ref<MemberRow[]>([]);
const roles = ref<Array<{ id: string; name: string; archivedAt: string | null }>>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const isUpdatingRole = ref(false);
const selectedActiveRoleId = ref<string>("");
const rolesError = ref<string | null>(null);
const isUpdatingMembers = ref<Record<string, boolean>>({});
const roleSelectionByMember = ref<Record<string, string>>({});
const activeRoleByMember = ref<Record<string, string>>({});
const archiveDialogOpen = ref(false);
const memberToArchive = ref<MemberRow | null>(null);

async function refresh() {
  isLoading.value = true;
  errorMessage.value = null;
  const [meRes, membersRes, rolesRes] = await Promise.allSettled([
    getMyMembership(companyId.value),
    listMembers(companyId.value),
    listRoles(companyId.value),
  ]);

  if (meRes.status === "fulfilled") {
    me.value = meRes.value.data;
    selectedActiveRoleId.value = me.value?.membership.activeRoleId ?? "";
  } else {
    errorMessage.value =
      (meRes.reason as any)?.data?.message ||
      (meRes.reason as any)?.message ||
      "Impossible de charger ton rôle actif.";
  }

  if (membersRes.status === "fulfilled") {
    members.value = membersRes.value.data ?? [];
    activeRoleByMember.value = members.value.reduce<Record<string, string>>((acc, m) => {
      acc[m.membership.id] = m.membership.activeRoleId ?? "";
      return acc;
    }, {});
  } else {
    errorMessage.value =
      (membersRes.reason as any)?.data?.message ||
      (membersRes.reason as any)?.message ||
      "Impossible de charger l'équipe.";
  }

  if (rolesRes.status === "fulfilled") {
    roles.value = (rolesRes.value.data ?? []).filter((r) => !r.archivedAt);
    rolesError.value = null;
  } else {
    rolesError.value =
      (rolesRes.reason as any)?.data?.message ||
      (rolesRes.reason as any)?.message ||
      "Impossible de charger les rôles.";
  }

  isLoading.value = false;
}

async function onUpdateMyActiveRole() {
  if (!selectedActiveRoleId.value) return;
  successMessage.value = null;
  errorMessage.value = null;
  isUpdatingRole.value = true;
  try {
    await updateMyMembership(companyId.value, selectedActiveRoleId.value);
    successMessage.value = "Rôle actif mis à jour.";
    await refresh();
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de mettre à jour ton rôle actif.";
    errorMessage.value = message;
  } finally {
    isUpdatingRole.value = false;
  }
}

function availableRoles(member: MemberRow) {
  const currentRoleIds = new Set(member.roles.map((r) => r.id));
  return roles.value.filter((r) => !currentRoleIds.has(r.id));
}

async function onAddRole(member: MemberRow) {
  const roleId = roleSelectionByMember.value[member.membership.id];
  if (!roleId) return;
  isUpdatingMembers.value[member.membership.id] = true;
  try {
    await addMemberRole(companyId.value, member.membership.id, roleId);
    roleSelectionByMember.value[member.membership.id] = "";
    await refresh();
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible d'ajouter le rôle.";
    errorMessage.value = message;
  } finally {
    isUpdatingMembers.value[member.membership.id] = false;
  }
}

async function onRemoveRole(member: MemberRow, roleId: string) {
  isUpdatingMembers.value[member.membership.id] = true;
  try {
    await removeMemberRole(companyId.value, member.membership.id, roleId);
    await refresh();
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de retirer le rôle.";
    errorMessage.value = message;
  } finally {
    isUpdatingMembers.value[member.membership.id] = false;
  }
}

async function onUpdateMemberActiveRole(member: MemberRow) {
  const roleId = activeRoleByMember.value[member.membership.id];
  if (!roleId) return;
  isUpdatingMembers.value[member.membership.id] = true;
  try {
    await updateMember(companyId.value, member.membership.id, roleId);
    successMessage.value = "Rôle actif mis à jour.";
    await refresh();
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de mettre à jour le rôle actif.";
    errorMessage.value = message;
  } finally {
    isUpdatingMembers.value[member.membership.id] = false;
  }
}

async function onArchiveMember() {
  if (!memberToArchive.value) return;
  isUpdatingMembers.value[memberToArchive.value.membership.id] = true;
  try {
    await archiveMember(companyId.value, memberToArchive.value.membership.id);
    memberToArchive.value = null;
    archiveDialogOpen.value = false;
    await refresh();
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible d'archiver le membre.";
    errorMessage.value = message;
  } finally {
    if (memberToArchive.value) {
      isUpdatingMembers.value[memberToArchive.value.membership.id] = false;
    }
  }
}

onMounted(refresh);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Users class="h-6 w-6" />
          Équipe
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Membres de l'entreprise + ton rôle actif.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <NuxtLink :to="`/companies/${companyId}/team/invites`">
          <Button variant="outline">Invitations</Button>
        </NuxtLink>
        <NuxtLink :to="`/companies/${companyId}/team/roles`">
          <Button variant="outline">Rôles</Button>
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
        <CardTitle class="text-lg">Mon rôle actif</CardTitle>
        <CardDescription>Utilisé par défaut pour les shifts.</CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="isLoading" class="text-sm text-muted-foreground">Chargement…</div>
        <div v-else-if="me" class="flex flex-wrap items-center gap-2">
          <NativeSelect
            class="max-w-sm"
            :value="selectedActiveRoleId"
            @change="selectedActiveRoleId = ($event.target as HTMLSelectElement).value"
          >
            <option v-for="r in me.roles" :key="r.id" :value="r.id">
              {{ r.name }}
            </option>
          </NativeSelect>
          <Button variant="outline" :disabled="isUpdatingRole" @click="onUpdateMyActiveRole">
            {{ isUpdatingRole ? "Mise à jour..." : "Mettre à jour" }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">Membres</CardTitle>
        <CardDescription>Liste des membres (permissions requises pour certaines actions).</CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="rolesError" class="mb-3 text-sm text-muted-foreground">
          Rôles indisponibles (permissions requises).
        </div>
        <div class="rounded-xl border border-border bg-background/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôles</TableHead>
                <TableHead>Rôle actif</TableHead>
                <TableHead class="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="!isLoading && members.length === 0" :colspan="5">
                Aucun membre
              </TableEmpty>

              <TableRow v-if="isLoading">
                <TableCell colspan="5" class="text-muted-foreground">Chargement…</TableCell>
              </TableRow>

              <TableRow v-for="m in members" :key="m.membership.id">
                <TableCell class="font-medium">{{ m.user.name }}</TableCell>
                <TableCell class="text-muted-foreground">{{ m.user.email }}</TableCell>
                <TableCell>
                  <div class="space-y-2">
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="r in m.roles"
                        :key="r.id"
                        class="group inline-flex items-center gap-1 rounded-full border border-border bg-muted/70 px-2 py-1 text-xs text-foreground"
                      >
                        {{ r.name }}
                        <button
                          v-if="!rolesError"
                          type="button"
                          class="text-muted-foreground opacity-70 transition hover:text-foreground group-hover:opacity-100"
                          @click="onRemoveRole(m, r.id)"
                        >
                          <X class="h-3 w-3" />
                        </button>
                      </span>
                      <span
                        v-if="m.roles.length === 0"
                        class="rounded-full border border-dashed border-border px-2 py-1 text-xs text-muted-foreground"
                      >
                        Aucun rôle
                      </span>
                    </div>
                    <div v-if="!rolesError" class="flex items-center gap-2">
                      <NativeSelect
                        class="w-full max-w-[200px]"
                        :value="roleSelectionByMember[m.membership.id]"
                        @change="
                          roleSelectionByMember[m.membership.id] = (
                            $event.target as HTMLSelectElement
                          ).value
                        "
                      >
                        <option value="">Ajouter un rôle…</option>
                        <option
                          v-for="r in availableRoles(m)"
                          :key="r.id"
                          :value="r.id"
                        >
                          {{ r.name }}
                        </option>
                      </NativeSelect>
                      <Button
                        size="sm"
                        variant="secondary"
                        class="shrink-0"
                        :disabled="!roleSelectionByMember[m.membership.id]"
                        @click="onAddRole(m)"
                      >
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </TableCell>
                <TableCell class="text-muted-foreground">
                  <div v-if="rolesError || roles.length === 0">
                    {{ m.membership.activeRoleId ?? "—" }}
                  </div>
                  <div v-else class="flex items-center gap-2">
                    <NativeSelect
                      class="max-w-[180px]"
                      :value="activeRoleByMember[m.membership.id]"
                      @change="
                        activeRoleByMember[m.membership.id] = (
                          $event.target as HTMLSelectElement
                        ).value
                      "
                    >
                      <option value="" disabled>Choisir un rôle</option>
                      <option v-for="r in roles" :key="r.id" :value="r.id">
                        {{ r.name }}
                      </option>
                    </NativeSelect>
                    <Button
                      size="sm"
                      variant="outline"
                      :disabled="!activeRoleByMember[m.membership.id]"
                      @click="onUpdateMemberActiveRole(m)"
                    >
                      Mettre à jour
                    </Button>
                  </div>
                </TableCell>
                <TableCell class="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    @click="memberToArchive = m; archiveDialogOpen = true"
                  >
                    <UserMinus class="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>

  <AlertDialog :open="archiveDialogOpen" @update:open="archiveDialogOpen = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Archiver ce membre ?</AlertDialogTitle>
        <AlertDialogDescription>
          Le membre perdra l’accès à l’entreprise.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isUpdatingMembers[memberToArchive?.membership.id || '']">
          Annuler
        </AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          :disabled="isUpdatingMembers[memberToArchive?.membership.id || '']"
          @click="onArchiveMember"
        >
          Archiver
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

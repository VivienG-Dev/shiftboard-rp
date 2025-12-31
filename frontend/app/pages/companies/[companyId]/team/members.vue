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
import { Users } from "lucide-vue-next";

const route = useRoute();
const companyId = computed(() => String(route.params.companyId));

const { getMyMembership, updateMyMembership, listMembers } = useCompanyTeam();

const me = ref<MyMembership | null>(null);
const members = ref<MemberRow[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const isUpdatingRole = ref(false);
const selectedActiveRoleId = ref<string>("");

async function refresh() {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const [meRes, membersRes] = await Promise.all([
      getMyMembership(companyId.value),
      listMembers(companyId.value),
    ]);
    me.value = meRes.data;
    members.value = membersRes.data ?? [];
    selectedActiveRoleId.value = me.value?.membership.activeRoleId ?? "";
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger l'équipe.";
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
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

      <NuxtLink :to="`/companies/${companyId}/team/invites`">
        <Button variant="outline">Invitations</Button>
      </NuxtLink>
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
          <NativeSelect v-model="selectedActiveRoleId" class="max-w-sm">
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
        <div class="rounded-xl border border-border bg-background/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôles</TableHead>
                <TableHead class="text-right">Rôle actif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="!isLoading && members.length === 0" :colspan="4">
                Aucun membre
              </TableEmpty>

              <TableRow v-if="isLoading">
                <TableCell colspan="4" class="text-muted-foreground">Chargement…</TableCell>
              </TableRow>

              <TableRow v-for="m in members" :key="m.membership.id">
                <TableCell class="font-medium">{{ m.user.name }}</TableCell>
                <TableCell class="text-muted-foreground">{{ m.user.email }}</TableCell>
                <TableCell>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="r in m.roles"
                      :key="r.id"
                      class="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {{ r.name }}
                    </span>
                  </div>
                </TableCell>
                <TableCell class="text-right text-muted-foreground">
                  {{ m.membership.activeRoleId ?? "—" }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>


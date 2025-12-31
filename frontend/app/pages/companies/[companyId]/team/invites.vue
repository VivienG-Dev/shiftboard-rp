<script setup lang="ts">
definePageMeta({
  middleware: "auth",
  layout: "company",
  ssr: false,
});

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import type { CompanyRole, Invite } from "~/composables/useCompanyTeam";
import { Copy, MailPlus, RefreshCw } from "lucide-vue-next";

const route = useRoute();
const companyId = computed(() => String(route.params.companyId));

const { listInvites, createInvite, listRoles } = useCompanyTeam();

const invites = ref<Invite[]>([]);
const roles = ref<CompanyRole[]>([]);
const isLoading = ref(true);
const isCreating = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const email = ref("");
const roleId = ref("");
const expiresInHours = ref("72");

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function refresh() {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const [invRes, rolesRes] = await Promise.all([
      listInvites(companyId.value),
      listRoles(companyId.value),
    ]);
    invites.value = invRes.data ?? [];
    roles.value = (rolesRes.data ?? []).filter((r) => !r.archivedAt);
    if (!roleId.value) {
      roleId.value = roles.value[0]?.id ?? "";
    }
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger les invitations (permissions requises).";
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
}

async function onCreate() {
  successMessage.value = null;
  errorMessage.value = null;
  isCreating.value = true;
  try {
    const hours = Number(expiresInHours.value);
    const res = await createInvite(companyId.value, {
      email: email.value.trim(),
      roleId: roleId.value,
      expiresInHours: Number.isFinite(hours) ? hours : 72,
    });

    email.value = "";
    successMessage.value = `Code créé: ${res.data.code}`;
    await refresh();
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de créer l'invitation.";
    errorMessage.value = message;
  } finally {
    isCreating.value = false;
  }
}

async function copy(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    successMessage.value = `Copié: ${code}`;
  } catch {
    successMessage.value = `Code: ${code}`;
  }
}

onMounted(refresh);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <MailPlus class="h-6 w-6" />
          Invitations
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Crée un code d’invitation lié à un email. L’utilisateur accepte via son compte.
        </p>
      </div>

      <NuxtLink :to="`/companies/${companyId}/team/members`">
        <Button variant="outline">Membres</Button>
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
        <CardTitle class="text-lg">Créer une invitation</CardTitle>
        <CardDescription>Le code doit être accepté par un compte avec le même email.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-3 md:grid-cols-3">
          <Input v-model="email" type="email" placeholder="email@exemple.com" />
          <NativeSelect v-model="roleId">
            <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
          </NativeSelect>
          <Input v-model="expiresInHours" type="number" min="1" placeholder="72" />
        </div>
      </CardContent>
      <CardFooter class="flex justify-end">
        <Button
          class="bg-gradient-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
          :disabled="isCreating || !email || !roleId"
          @click="onCreate"
        >
          {{ isCreating ? "Création..." : "Créer" }}
        </Button>
      </CardFooter>
    </Card>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">Liste</CardTitle>
        <CardDescription>Invitations créées</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex justify-end pb-3">
          <Button variant="outline" size="sm" @click="refresh">
            <RefreshCw class="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>
        <div class="rounded-xl border border-border bg-background/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Expire</TableHead>
                <TableHead class="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="!isLoading && invites.length === 0" :colspan="5">
                Aucune invitation
              </TableEmpty>

              <TableRow v-if="isLoading">
                <TableCell colspan="5" class="text-muted-foreground">Chargement…</TableCell>
              </TableRow>

              <TableRow v-for="inv in invites" :key="inv.id">
                <TableCell class="font-medium">{{ inv.email }}</TableCell>
                <TableCell class="text-muted-foreground">{{ inv.code }}</TableCell>
                <TableCell class="text-muted-foreground">{{ inv.status }}</TableCell>
                <TableCell class="text-muted-foreground">{{ formatDate(inv.expiresAt) }}</TableCell>
                <TableCell class="text-right">
                  <Button variant="outline" size="sm" @click="copy(inv.code)">
                    <Copy class="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>


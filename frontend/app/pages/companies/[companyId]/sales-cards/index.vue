<script setup lang="ts">
definePageMeta({
  middleware: "auth",
  layout: "company",
  ssr: false,
});

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useCompanyShifts } from "~/composables/useCompanyShifts";
import type {
  SalesCard,
  SalesCardStatus,
} from "~/composables/useCompanyShifts";
import { useCompanyTeam } from "~/composables/useCompanyTeam";
import type { MemberRow } from "~/composables/useCompanyTeam";
import { Eye, Filter, Lock, RefreshCcw } from "lucide-vue-next";

const route = useRoute();
const companyId = computed(() => String(route.params.companyId));

const { listSalesCards, lockSalesCard } = useCompanyShifts();
const { listMembers } = useCompanyTeam();

const cards = ref<SalesCard[]>([]);
const members = ref<MemberRow[]>([]);
const canLoadMembers = ref(true);

const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const from = ref<string>("");
const to = ref<string>("");
const status = ref<SalesCardStatus | "ALL">("ALL");
const userId = ref<string>("ALL");

const isLockDialogOpen = ref(false);
const cardToLock = ref<SalesCard | null>(null);
const isLocking = ref(false);

function toIsoStart(dateValue: string) {
  if (!dateValue) return undefined;
  return new Date(`${dateValue}T00:00:00`).toISOString();
}

function toIsoEnd(dateValue: string) {
  if (!dateValue) return undefined;
  return new Date(`${dateValue}T23:59:59`).toISOString();
}

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function itemsSold(card: SalesCard) {
  return (card.lines ?? []).reduce(
    (sum, l) => sum + (Number(l.quantitySold) || 0),
    0
  );
}

const membersByUserId = computed(() => {
  const map = new Map<string, MemberRow>();
  for (const m of members.value) map.set(m.user.id, m);
  return map;
});

function displayUser(card: SalesCard) {
  const m = membersByUserId.value.get(card.userId);
  if (!m) return card.userId;
  return m.user.name || m.user.email;
}

async function loadMembersSafe() {
  if (!canLoadMembers.value) return;
  try {
    const res = await listMembers(companyId.value);
    members.value = res.data ?? [];
  } catch {
    canLoadMembers.value = false;
  }
}

async function refresh() {
  isLoading.value = true;
  errorMessage.value = null;
  successMessage.value = null;
  try {
    const res = await listSalesCards(companyId.value, {
      from: toIsoStart(from.value),
      to: toIsoEnd(to.value),
      status: status.value === "ALL" ? undefined : status.value,
      userId: userId.value === "ALL" ? undefined : userId.value,
    });
    cards.value = res.data ?? [];
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger les rapports.";
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
}

function openLockDialog(card: SalesCard) {
  cardToLock.value = card;
  isLockDialogOpen.value = true;
}

async function onLockConfirmed() {
  if (!cardToLock.value) return;
  isLocking.value = true;
  errorMessage.value = null;
  try {
    await lockSalesCard(companyId.value, cardToLock.value.id);
    successMessage.value = "Rapport verrouillé.";
    isLockDialogOpen.value = false;
    cardToLock.value = null;
    await refresh();
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de verrouiller ce rapport.";
    errorMessage.value = message;
  } finally {
    isLocking.value = false;
  }
}

onMounted(async () => {
  await loadMembersSafe();
  await refresh();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">
          Rapports (Sales cards)
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Liste et filtres pour les shifts soumis. Tu peux verrouiller un
          rapport pour le figer.
        </p>
      </div>
      <div class="flex gap-2">
        <NuxtLink :to="`/companies/${companyId}/shifts`">
          <Button variant="outline">Aller aux shifts</Button>
        </NuxtLink>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
      {{ errorMessage }}
    </div>
    <div
      v-if="successMessage"
      class="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200">
      {{ successMessage }}
    </div>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="flex items-center gap-2 text-lg">
          <Filter class="h-4 w-4" />
          Filtres
        </CardTitle>
        <CardDescription>Période, statut et utilisateur</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-3 md:grid-cols-4">
          <div>
            <div class="mb-1 text-xs font-medium text-muted-foreground">Du</div>
            <Input v-model="from" type="date" />
          </div>
          <div>
            <div class="mb-1 text-xs font-medium text-muted-foreground">Au</div>
            <Input v-model="to" type="date" />
          </div>
          <div>
            <div class="mb-1 text-xs font-medium text-muted-foreground">
              Statut
            </div>
            <NativeSelect v-model="status">
              <option value="ALL">Tous</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="LOCKED">LOCKED</option>
            </NativeSelect>
          </div>
          <div>
            <div class="mb-1 text-xs font-medium text-muted-foreground">
              Utilisateur
            </div>
            <NativeSelect v-if="members.length > 0" v-model="userId">
              <option value="ALL">Tous</option>
              <option v-for="m in members" :key="m.user.id" :value="m.user.id">
                {{ m.user.name || m.user.email }}
              </option>
            </NativeSelect>
            <Input v-else v-model="userId" placeholder="UserId (optionnel)" />
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button variant="outline" @click="refresh" :disabled="isLoading">
            <RefreshCcw class="mr-2 h-4 w-4" />
            Appliquer
          </Button>
          <Button
            variant="ghost"
            @click="
              from = '';
              to = '';
              status = 'ALL';
              userId = 'ALL';
              refresh();
            "
            :disabled="isLoading">
            Réinitialiser
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">Rapports</CardTitle>
        <CardDescription>Derniers résultats</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="rounded-xl border border-border bg-background/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Début</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead class="text-right">Items vendus</TableHead>
                <TableHead class="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="!isLoading && cards.length === 0" :colspan="6">
                Aucun rapport
              </TableEmpty>

              <TableRow v-if="isLoading">
                <TableCell colspan="6" class="text-muted-foreground"
                  >Chargement…</TableCell
                >
              </TableRow>

              <TableRow v-for="card in cards" :key="card.id">
                <TableCell class="font-medium">{{
                  formatDate(card.startAt)
                }}</TableCell>
                <TableCell class="text-muted-foreground">
                  {{ card.endAt ? formatDate(card.endAt) : "—" }}
                </TableCell>
                <TableCell class="text-muted-foreground">{{
                  card.status
                }}</TableCell>
                <TableCell class="text-muted-foreground">{{
                  displayUser(card)
                }}</TableCell>
                <TableCell class="text-right text-muted-foreground">{{
                  itemsSold(card)
                }}</TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-2">
                    <NuxtLink
                      :to="`/companies/${companyId}/sales-cards/${card.id}`">
                      <Button variant="outline" size="sm">
                        <Eye class="h-4 w-4" />
                      </Button>
                    </NuxtLink>
                    <Button
                      v-if="card.status === 'SUBMITTED'"
                      variant="outline"
                      size="sm"
                      @click="openLockDialog(card)">
                      <Lock class="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <AlertDialog v-model:open="isLockDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Verrouiller ce rapport ?</AlertDialogTitle>
          <AlertDialogDescription>
            Un rapport verrouillé devient immutable. Cette action est destinée
            aux managers/admins.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isLocking">Annuler</AlertDialogCancel>
          <AlertDialogAction
            class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
            :disabled="isLocking"
            @click="onLockConfirmed">
            Verrouiller
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

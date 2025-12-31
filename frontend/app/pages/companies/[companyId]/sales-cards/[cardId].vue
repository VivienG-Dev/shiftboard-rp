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
import type { SalesCard } from "~/composables/useCompanyShifts";
import { ArrowLeft, Lock } from "lucide-vue-next";

const route = useRoute();
const companyId = computed(() => String(route.params.companyId));
const cardId = computed(() => String(route.params.cardId));

const { getSalesCard, lockSalesCard } = useCompanyShifts();

const card = ref<SalesCard | null>(null);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const isLockDialogOpen = ref(false);
const isLocking = ref(false);

function clampToNumber(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatMoney(value: unknown) {
  const n = clampToNumber(value);
  if (n === null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function computeItemsSold(c: SalesCard) {
  return (c.lines ?? []).reduce((sum, l) => sum + (Number(l.quantitySold) || 0), 0);
}

function computeRevenue(c: SalesCard) {
  let total = 0;
  for (const line of c.lines ?? []) {
    const qty = clampToNumber(line.quantitySold) ?? 0;
    const lineTotal = clampToNumber(line.total);
    if (lineTotal !== null) total += lineTotal;
    else {
      const unit = clampToNumber(line.unitPrice) ?? 0;
      total += unit * qty;
    }
  }
  return total;
}

async function refresh() {
  isLoading.value = true;
  errorMessage.value = null;
  successMessage.value = null;
  try {
    const res = await getSalesCard(companyId.value, cardId.value);
    card.value = res.data;
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger le rapport.";
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
}

async function onLock() {
  if (!card.value) return;
  isLocking.value = true;
  errorMessage.value = null;
  try {
    const res = await lockSalesCard(companyId.value, card.value.id);
    card.value = res.data;
    successMessage.value = "Rapport verrouillé.";
    isLockDialogOpen.value = false;
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

onMounted(refresh);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Rapport</h1>
        <p class="mt-1 text-sm text-muted-foreground" v-if="card">
          {{ formatDate(card.startAt) }} • {{ card.status }}
          <span v-if="card.location"> • {{ card.location.name }}</span>
        </p>
      </div>
      <div class="flex gap-2">
        <NuxtLink :to="`/companies/${companyId}/sales-cards`">
          <Button variant="outline">
            <ArrowLeft class="mr-2 h-4 w-4" />
            Retour
          </Button>
        </NuxtLink>
        <Button
          v-if="card && card.status === 'SUBMITTED'"
          variant="outline"
          @click="isLockDialogOpen = true"
        >
          <Lock class="mr-2 h-4 w-4" />
          Verrouiller
        </Button>
      </div>
    </div>

    <div v-if="errorMessage" class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" class="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200">
      {{ successMessage }}
    </div>

    <Card v-if="card" class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">Résumé</CardTitle>
        <CardDescription>{{ card.note || "—" }}</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-3 md:grid-cols-3">
        <div class="rounded-lg border border-border bg-background/40 p-3">
          <div class="text-xs text-muted-foreground">Items vendus</div>
          <div class="mt-1 text-xl font-semibold">{{ computeItemsSold(card) }}</div>
        </div>
        <div class="rounded-lg border border-border bg-background/40 p-3">
          <div class="text-xs text-muted-foreground">Revenu estimé</div>
          <div class="mt-1 text-xl font-semibold">{{ formatMoney(computeRevenue(card)) }}</div>
        </div>
        <div class="rounded-lg border border-border bg-background/40 p-3">
          <div class="text-xs text-muted-foreground">Fin</div>
          <div class="mt-1 text-sm font-medium">
            {{ card.endAt ? formatDate(card.endAt) : "—" }}
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">Lignes</CardTitle>
        <CardDescription>Détail par item</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="rounded-xl border border-border bg-background/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead class="text-right">Prix</TableHead>
                <TableHead class="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="!isLoading && (!card || card.lines.length === 0)" :colspan="4">
                Aucune ligne
              </TableEmpty>
              <TableRow v-if="isLoading">
                <TableCell colspan="4" class="text-muted-foreground">Chargement…</TableCell>
              </TableRow>
              <TableRow v-for="line in card?.lines ?? []" :key="line.id">
                <TableCell class="font-medium">{{ line.item?.name ?? line.itemId }}</TableCell>
                <TableCell class="text-muted-foreground">
                  {{ line.quantitySold }} <span class="text-xs">{{ line.item?.unit ?? "" }}</span>
                </TableCell>
                <TableCell class="text-right text-muted-foreground">{{ formatMoney(line.unitPrice) }}</TableCell>
                <TableCell class="text-right font-semibold">{{ formatMoney(line.total) }}</TableCell>
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
            Un rapport verrouillé devient immutable.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isLocking">Annuler</AlertDialogCancel>
          <AlertDialogAction
            class="bg-gradient-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
            :disabled="isLocking"
            @click="onLock"
          >
            Verrouiller
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>


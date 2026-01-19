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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCompanyInventory } from "~/composables/useCompanyInventory";
import type { SnapshotDetail } from "~/composables/useCompanyInventory";
import { Camera } from "lucide-vue-next";

const route = useRoute();
const companyId = computed(() => String(route.params.companyId));
const snapshotId = computed(() => String(route.params.snapshotId));

const { getSnapshot } = useCompanyInventory();

const snapshot = ref<SnapshotDetail | null>(null);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const totalCost = computed(() => {
  if (!snapshot.value) return 0;
  return snapshot.value.lines.reduce((sum, line) => {
    const cost = line.item.costPrice;
    if (cost === null || cost === undefined) return sum;
    const value = typeof cost === "string" ? Number(cost) : cost;
    if (Number.isNaN(value)) return sum;
    return sum + value * line.quantity;
  }, 0);
});

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

async function load() {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const res = await getSnapshot(companyId.value, snapshotId.value);
    snapshot.value = res.data;
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger le snapshot.";
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Camera class="h-6 w-6" />
          Snapshot
        </h1>
        <p class="mt-1 text-sm text-muted-foreground" v-if="snapshot">
          {{ formatDate(snapshot.createdAt) }} •
          {{ snapshot.lines.length }} ligne(s)
        </p>
      </div>

      <div class="flex gap-2">
        <NuxtLink :to="`/companies/${companyId}/stock`">
          <Button variant="outline">Voir stock</Button>
        </NuxtLink>
        <NuxtLink :to="`/companies/${companyId}/snapshots/new`">
          <Button
            class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400">
            Nouveau snapshot
          </Button>
        </NuxtLink>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
      {{ errorMessage }}
    </div>

    <Card v-if="snapshot" class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">Détails</CardTitle>
        <CardDescription>{{ snapshot.note ?? "—" }}</CardDescription>
        <p class="text-sm text-muted-foreground">
          Valeur du stock: <span class="font-semibold text-foreground">{{ formatMoney(totalCost) }}</span>
        </p>
      </CardHeader>
      <CardContent>
        <div class="rounded-xl border border-border bg-background/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead class="text-right">Quantité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="line in snapshot.lines" :key="line.id">
                <TableCell class="font-medium">{{ line.item.name }}</TableCell>
                <TableCell class="text-muted-foreground">{{
                  line.item.unit
                }}</TableCell>
                <TableCell class="text-right">{{ line.quantity }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <div v-else-if="isLoading" class="text-sm text-muted-foreground">
      Chargement…
    </div>
  </div>
</template>

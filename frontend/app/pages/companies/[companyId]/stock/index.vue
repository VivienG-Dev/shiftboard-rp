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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCompanyInventory } from "~/composables/useCompanyInventory";
import type { ItemCategory, StockRow } from "~/composables/useCompanyInventory";
import { Boxes, Camera, TriangleAlert } from "lucide-vue-next";

const route = useRoute();
const companyId = computed(() => String(route.params.companyId));

const { getStock } = useCompanyInventory();

const rows = ref<StockRow[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

const categoryLabels: Record<ItemCategory, string> = {
  DRINK: "Boisson",
  SOFT_DRINK: "Soft",
  ALCOHOL_DRINK: "Alcool",
  BOTTLE: "Bouteille",
  FOOD: "Nourriture",
  OTHER: "Autre",
};

const hasBaselineSnapshot = computed(() =>
  rows.value.some((r) => r.baselineSnapshotId)
);

async function refresh() {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const res = await getStock(companyId.value);
    rows.value = res.data ?? [];
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger le stock.";
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
}

onMounted(refresh);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Boxes class="h-6 w-6" />
          Stock
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Stock calculé à partir du dernier snapshot + ventes soumises + restocks.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <NuxtLink :to="`/companies/${companyId}/snapshots`">
          <Button variant="outline">Snapshots</Button>
        </NuxtLink>
        <NuxtLink :to="`/companies/${companyId}/restocks`">
          <Button variant="outline">Restocks</Button>
        </NuxtLink>
        <NuxtLink :to="`/companies/${companyId}/snapshots/new`">
          <Button class="bg-gradient-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400">
            <Camera class="mr-2 h-4 w-4" />
            Nouveau snapshot
          </Button>
        </NuxtLink>
      </div>
    </div>

    <div v-if="errorMessage" class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
      {{ errorMessage }}
    </div>

    <Alert v-if="!isLoading && !hasBaselineSnapshot">
      <TriangleAlert />
      <AlertTitle>Aucun snapshot de base</AlertTitle>
      <AlertDescription>
        Pour avoir un stock réel (baseline), crée un snapshot initial.
      </AlertDescription>
    </Alert>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">Stock actuel</CardTitle>
        <CardDescription>Liste des items et quantités</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="rounded-xl border border-border bg-background/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead class="text-right">Baseline</TableHead>
                <TableHead class="text-right">Vendus</TableHead>
                <TableHead class="text-right">Restocks</TableHead>
                <TableHead class="text-right">Stock</TableHead>
                <TableHead class="text-right">Seuil</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="!isLoading && rows.length === 0" :colspan="8">
                Aucun item
              </TableEmpty>

              <TableRow v-if="isLoading">
                <TableCell colspan="8" class="text-muted-foreground">Chargement…</TableCell>
              </TableRow>

              <TableRow
                v-for="row in rows"
                :key="row.itemId"
                :class="row.isLowStock ? 'bg-red-500/5' : ''"
              >
                <TableCell class="font-medium">
                  <div class="flex items-center gap-2">
                    <span>{{ row.name }}</span>
                    <span
                      v-if="row.isLowStock"
                      class="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs text-red-200"
                    >
                      Stock faible
                    </span>
                  </div>
                </TableCell>
                <TableCell class="text-muted-foreground">{{ categoryLabels[row.category] }}</TableCell>
                <TableCell class="text-muted-foreground">{{ row.unit }}</TableCell>
                <TableCell class="text-right text-muted-foreground">{{ row.baselineQuantity }}</TableCell>
                <TableCell class="text-right text-muted-foreground">{{ row.soldSinceBaseline }}</TableCell>
                <TableCell class="text-right text-muted-foreground">{{ row.restockedSinceBaseline }}</TableCell>
                <TableCell class="text-right font-semibold">{{ row.currentStock }}</TableCell>
                <TableCell class="text-right text-muted-foreground">
                  {{ row.lowStockThreshold ?? "—" }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

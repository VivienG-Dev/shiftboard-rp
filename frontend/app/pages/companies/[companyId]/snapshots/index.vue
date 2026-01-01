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
import { useCompanyInventory } from "~/composables/useCompanyInventory";
import type { SnapshotListItem } from "~/composables/useCompanyInventory";
import { Camera, Plus } from "lucide-vue-next";

const route = useRoute();
const companyId = computed(() => String(route.params.companyId));

const { listSnapshots } = useCompanyInventory();

const snapshots = ref<SnapshotListItem[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

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
    const res = await listSnapshots(companyId.value);
    snapshots.value = res.data ?? [];
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger les snapshots.";
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
          <Camera class="h-6 w-6" />
          Snapshots
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Les snapshots sont des inventaires complets (stock-take). Le dernier
          snapshot sert de baseline pour le stock.
        </p>
      </div>

      <NuxtLink :to="`/companies/${companyId}/snapshots/new`">
        <Button
          class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400">
          <Plus class="mr-2 h-4 w-4" />
          Nouveau snapshot
        </Button>
      </NuxtLink>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
      {{ errorMessage }}
    </div>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">Historique</CardTitle>
        <CardDescription>Derniers snapshots</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="rounded-xl border border-border bg-background/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Note</TableHead>
                <TableHead class="text-right">Lignes</TableHead>
                <TableHead class="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty
                v-if="!isLoading && snapshots.length === 0"
                :colspan="4">
                Aucun snapshot
              </TableEmpty>

              <TableRow v-if="isLoading">
                <TableCell colspan="4" class="text-muted-foreground"
                  >Chargement…</TableCell
                >
              </TableRow>

              <TableRow v-for="s in snapshots" :key="s.id">
                <TableCell class="font-medium">{{
                  formatDate(s.createdAt)
                }}</TableCell>
                <TableCell class="text-muted-foreground">{{
                  s.note ?? "—"
                }}</TableCell>
                <TableCell class="text-right text-muted-foreground">{{
                  s._count.lines
                }}</TableCell>
                <TableCell class="text-right">
                  <NuxtLink :to="`/companies/${companyId}/snapshots/${s.id}`">
                    <Button variant="outline" size="sm">Voir</Button>
                  </NuxtLink>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

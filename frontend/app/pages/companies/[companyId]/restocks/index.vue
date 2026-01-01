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
import type { RestockListItem } from "~/composables/useCompanyInventory";
import { Plus, Truck } from "lucide-vue-next";

const route = useRoute();
const companyId = computed(() => String(route.params.companyId));

const { listRestocks } = useCompanyInventory();

const restocks = ref<RestockListItem[]>([]);
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
    const res = await listRestocks(companyId.value);
    restocks.value = res.data ?? [];
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger les restocks.";
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
          <Truck class="h-6 w-6" />
          Restocks
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Les restocks ajoutent du stock (livraisons). Ils augmentent le stock
          depuis le dernier snapshot.
        </p>
      </div>

      <NuxtLink :to="`/companies/${companyId}/restocks/new`">
        <Button
          class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400">
          <Plus class="mr-2 h-4 w-4" />
          Nouveau restock
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
        <CardDescription>Derniers restocks</CardDescription>
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
                v-if="!isLoading && restocks.length === 0"
                :colspan="4">
                Aucun restock
              </TableEmpty>

              <TableRow v-if="isLoading">
                <TableCell colspan="4" class="text-muted-foreground"
                  >Chargement…</TableCell
                >
              </TableRow>

              <TableRow v-for="r in restocks" :key="r.id">
                <TableCell class="font-medium">{{
                  formatDate(r.createdAt)
                }}</TableCell>
                <TableCell class="text-muted-foreground">{{
                  r.note ?? "—"
                }}</TableCell>
                <TableCell class="text-right text-muted-foreground">{{
                  r._count.lines
                }}</TableCell>
                <TableCell class="text-right">
                  <NuxtLink :to="`/companies/${companyId}/restocks/${r.id}`">
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

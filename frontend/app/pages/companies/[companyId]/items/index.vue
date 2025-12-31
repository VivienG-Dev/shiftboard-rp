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
import { useCompanyInventory } from "~/composables/useCompanyInventory";
import type { Item, ItemCategory } from "~/composables/useCompanyInventory";
import { Archive, Pencil, Plus, Search } from "lucide-vue-next";
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

const route = useRoute();
const companyId = computed(() => String(route.params.companyId));

const { listItems, archiveItem } = useCompanyInventory();

const items = ref<Item[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const isArchiveDialogOpen = ref(false);
const itemToArchive = ref<Item | null>(null);

const search = ref("");
const category = ref<ItemCategory | "ALL">("ALL");
const includeArchived = ref(false);

const categoryOptions: Array<{ value: ItemCategory | "ALL"; label: string }> = [
  { value: "ALL", label: "Toutes catégories" },
  { value: "DRINK", label: "Boisson" },
  { value: "SOFT_DRINK", label: "Soft" },
  { value: "ALCOHOL_DRINK", label: "Alcool" },
  { value: "BOTTLE", label: "Bouteille" },
  { value: "FOOD", label: "Nourriture" },
  { value: "OTHER", label: "Autre" },
];

function formatCategory(value: ItemCategory) {
  return (
    categoryOptions.find((o) => o.value === value)?.label ?? value
  );
}

function formatMoney(value: number | null) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

async function refresh() {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const res = await listItems(companyId.value, {
      search: search.value.trim() || undefined,
      category: category.value === "ALL" ? undefined : category.value,
      includeArchived: includeArchived.value,
      activeOnly: !includeArchived.value,
    });
    items.value = res.data ?? [];
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger l'inventaire.";
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
}

async function onArchiveConfirmed() {
  if (!itemToArchive.value) return;
  try {
    await archiveItem(companyId.value, itemToArchive.value.id);
    await refresh();
    isArchiveDialogOpen.value = false;
    itemToArchive.value = null;
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible d'archiver l'item.";
    errorMessage.value = message;
  }
}

watch([search, category, includeArchived], () => refresh(), { deep: true });
onMounted(refresh);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Inventaire</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Crée des items (bouteilles, boissons, nourriture…). Ensuite tu pourras faire un snapshot et suivre le stock.
        </p>
      </div>

      <NuxtLink :to="`/companies/${companyId}/items/new`">
        <Button class="bg-gradient-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400">
          <Plus class="mr-2 h-4 w-4" />
          Ajouter un item
        </Button>
      </NuxtLink>
    </div>

    <div v-if="errorMessage" class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
      {{ errorMessage }}
    </div>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">Catalogue</CardTitle>
        <CardDescription>Recherche + filtres</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-3 md:grid-cols-3">
          <div class="relative">
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input v-model="search" class="pl-9" placeholder="Rechercher…" />
          </div>

          <NativeSelect v-model="category">
            <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </NativeSelect>

          <label class="flex items-center gap-2 text-sm text-muted-foreground">
            <input v-model="includeArchived" type="checkbox" class="h-4 w-4" />
            Afficher les archivés
          </label>
        </div>

        <div class="rounded-xl border border-border bg-background/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Seuil stock</TableHead>
                <TableHead class="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="!isLoading && items.length === 0" :colspan="6">
                Aucun item
              </TableEmpty>

              <TableRow v-if="isLoading">
                <TableCell colspan="6" class="text-muted-foreground">Chargement…</TableCell>
              </TableRow>

              <TableRow v-for="item in items" :key="item.id">
                <TableCell class="font-medium">
                  <div class="flex items-center gap-2">
                    <span>{{ item.name }}</span>
                    <span
                      v-if="item.archivedAt"
                      class="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      Archivé
                    </span>
                  </div>
                </TableCell>
                <TableCell class="text-muted-foreground">{{ formatCategory(item.category) }}</TableCell>
                <TableCell class="text-muted-foreground">{{ item.unit }}</TableCell>
                <TableCell class="text-muted-foreground">{{ formatMoney(item.basePrice) }}</TableCell>
                <TableCell class="text-muted-foreground">
                  {{ item.lowStockThreshold ?? "—" }}
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-2">
                    <NuxtLink :to="`/companies/${companyId}/items/${item.id}/edit`">
                      <Button variant="outline" size="sm">
                        <Pencil class="h-4 w-4" />
                      </Button>
                    </NuxtLink>
                    <Button
                      v-if="!item.archivedAt"
                      variant="outline"
                      size="sm"
                      @click="
                        itemToArchive = item;
                        isArchiveDialogOpen = true;
                      "
                    >
                      <Archive class="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <AlertDialog v-model:open="isArchiveDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archiver l'item ?</AlertDialogTitle>
          <AlertDialogDescription>
            <span v-if="itemToArchive">“{{ itemToArchive.name }}”</span>
            <span v-else>Cet item</span>
            ne sera plus sélectionnable pour les nouveaux snapshots/restocks/shifts.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            class="bg-gradient-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
            @click="onArchiveConfirmed"
          >
            Archiver
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

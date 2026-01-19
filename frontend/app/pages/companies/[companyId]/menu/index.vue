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
import { Plus, Trash2 } from "lucide-vue-next";
import { useCompanyMenu } from "~/composables/useCompanyMenu";
import type { MenuEntry } from "~/composables/useCompanyMenu";
import { useCompanyInventory } from "~/composables/useCompanyInventory";
import type { Item } from "~/composables/useCompanyInventory";

const route = useRoute();
const companyId = computed(() => String(route.params.companyId));

const { listMenuEntries, createMenuEntry, deleteMenuEntry } = useCompanyMenu();
const { listItems } = useCompanyInventory();

const menuEntries = ref<MenuEntry[]>([]);
const items = ref<Item[]>([]);
const isLoading = ref(true);
const isSaving = ref(false);
const errorMessage = ref<string | null>(null);

const selectedItemId = ref("");
const customName = ref("");
const customPrice = ref<number | null>(null);

const selectedItem = computed(() =>
  items.value.find((item) => item.id === selectedItemId.value)
);

function formatMoney(value: number | null) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatEntryType(entry: MenuEntry) {
  return entry.type === "ITEM" ? "Item" : "Prestation";
}

async function refreshMenu() {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const res = await listMenuEntries(companyId.value);
    menuEntries.value = res.data ?? [];
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger la carte.";
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
}

async function loadItems() {
  try {
    const res = await listItems(companyId.value, {
      activeOnly: true,
      includeArchived: false,
    });
    items.value = res.data ?? [];
  } catch {
    items.value = [];
  }
}

async function addItemEntry() {
  if (!selectedItemId.value) return;
  isSaving.value = true;
  errorMessage.value = null;
  try {
    await createMenuEntry(companyId.value, { itemId: selectedItemId.value });
    selectedItemId.value = "";
    await refreshMenu();
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible d'ajouter l'item.";
    errorMessage.value = message;
  } finally {
    isSaving.value = false;
  }
}

async function addCustomEntry() {
  const name = customName.value.trim();
  if (!name || customPrice.value === null || Number.isNaN(customPrice.value)) {
    errorMessage.value = "Nom et prix requis pour une prestation.";
    return;
  }
  isSaving.value = true;
  errorMessage.value = null;
  try {
    await createMenuEntry(companyId.value, {
      name,
      price: customPrice.value,
    });
    customName.value = "";
    customPrice.value = null;
    await refreshMenu();
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible d'ajouter la prestation.";
    errorMessage.value = message;
  } finally {
    isSaving.value = false;
  }
}

async function removeEntry(entryId: string) {
  isSaving.value = true;
  errorMessage.value = null;
  try {
    await deleteMenuEntry(companyId.value, entryId);
    await refreshMenu();
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de retirer l'entrée.";
    errorMessage.value = message;
  } finally {
    isSaving.value = false;
  }
}

onMounted(async () => {
  await Promise.all([loadItems(), refreshMenu()]);
});
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Carte</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Liste les prestations vendues par l'entreprise (items + prestations
        personnalisées).
      </p>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
      {{ errorMessage }}
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <Card class="border-border bg-card/60">
        <CardHeader class="space-y-1">
          <CardTitle class="text-lg">Ajouter un item</CardTitle>
          <CardDescription>Choisis un item existant.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <NativeSelect
            :value="selectedItemId"
            @change="selectedItemId = ($event.target as HTMLSelectElement).value">
            <option value="">Sélectionner un item</option>
            <option v-for="item in items" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </NativeSelect>

          <div class="text-sm text-muted-foreground">
            Prix: {{
              selectedItem
                ? formatMoney(selectedItem.basePrice)
                : "Sélectionne un item"
            }}
          </div>

          <Button
            class="w-full bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
            :disabled="!selectedItemId || isSaving"
            @click="addItemEntry">
            <Plus class="mr-2 h-4 w-4" />
            Ajouter à la carte
          </Button>
        </CardContent>
      </Card>

      <Card class="border-border bg-card/60">
        <CardHeader class="space-y-1">
          <CardTitle class="text-lg">Ajouter une prestation</CardTitle>
          <CardDescription>Nom + prix fixe.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <Input v-model="customName" placeholder="Nom de la prestation" />
          <Input
            :value="customPrice"
            @change="customPrice = Number((($event.target as HTMLInputElement).value))"
            type="number"
            min="0"
            step="0.01"
            placeholder="Prix (€)"
          />
          <Button
            class="w-full bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
            :disabled="!customName.trim() || customPrice === null || isSaving"
            @click="addCustomEntry">
            <Plus class="mr-2 h-4 w-4" />
            Ajouter la prestation
          </Button>
        </CardContent>
      </Card>
    </div>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">Carte actuelle</CardTitle>
        <CardDescription>Visible dans le dashboard privé.</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="rounded-xl border border-border bg-background/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead class="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="!isLoading && menuEntries.length === 0" :colspan="4">
                Aucun élément dans la carte.
              </TableEmpty>

              <TableRow v-if="isLoading">
                <TableCell colspan="4" class="text-muted-foreground"
                  >Chargement…</TableCell
                >
              </TableRow>

              <TableRow v-for="entry in menuEntries" :key="entry.id">
                <TableCell class="font-medium">{{ entry.name }}</TableCell>
                <TableCell class="text-muted-foreground">{{
                  formatEntryType(entry)
                }}</TableCell>
                <TableCell class="text-muted-foreground">{{
                  formatMoney(entry.price)
                }}</TableCell>
                <TableCell class="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    :disabled="isSaving"
                    @click="removeEntry(entry.id)">
                    <Trash2 class="h-4 w-4" />
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

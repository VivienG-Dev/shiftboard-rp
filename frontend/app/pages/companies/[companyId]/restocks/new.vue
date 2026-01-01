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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
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
import type { Item } from "~/composables/useCompanyInventory";
import { Loader2, Save, Truck } from "lucide-vue-next";

const route = useRoute();
const router = useRouter();
const companyId = computed(() => String(route.params.companyId));

const { listItems, createRestock } = useCompanyInventory();

const items = ref<Item[]>([]);
const isLoading = ref(true);
const isSaving = ref(false);
const errorMessage = ref<string | null>(null);
const note = ref<string>("");
const quantities = ref<Record<string, number | null | undefined>>({});

async function loadItems() {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const res = await listItems(companyId.value, { activeOnly: true });
    items.value = (res.data ?? []).filter((i) => !i.archivedAt);
    const next: Record<string, number | null | undefined> = {};
    for (const item of items.value)
      next[item.id] = quantities.value[item.id] ?? null;
    quantities.value = next;
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger les items.";
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
}

function parsePositiveInt(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return NaN;
    if (!Number.isInteger(value) || value < 1) return NaN;
    return value;
  }
  const s = String(value);
  if (s.trim() === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return NaN;
  return n;
}

async function onSubmit() {
  errorMessage.value = null;
  isSaving.value = true;
  try {
    const lines = Object.entries(quantities.value)
      .map(([itemId, qty]) => ({
        itemId,
        quantityAdded: parsePositiveInt(qty),
      }))
      .filter((l) => l.quantityAdded !== null);

    if (lines.some((l) => Number.isNaN(l.quantityAdded))) {
      throw new Error("Les quantités doivent être des entiers ≥ 1.");
    }
    if (lines.length === 0) {
      throw new Error("Ajoute au moins une ligne (quantité).");
    }

    const res = await createRestock(companyId.value, {
      note: note.value.trim() || undefined,
      lines: lines as Array<{ itemId: string; quantityAdded: number }>,
    });

    router.push(`/companies/${companyId.value}/restocks/${res.data.id}`);
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de créer le restock.";
    errorMessage.value = message;
  } finally {
    isSaving.value = false;
  }
}

onMounted(loadItems);
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="flex items-center gap-2 text-3xl font-bold tracking-tight">
        <Truck class="h-6 w-6" />
        Nouveau restock
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Saisis les quantités ajoutées (livraison). Laisse vide si non concerné.
      </p>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
      {{ errorMessage }}
    </div>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">Note (optionnel)</CardTitle>
        <CardDescription>Ex: “Livraison fournisseur”</CardDescription>
      </CardHeader>
      <CardContent>
        <Input v-model="note" placeholder="Note…" />
      </CardContent>
    </Card>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">Lignes</CardTitle>
        <CardDescription>Quantité ajoutée par item (≥ 1)</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="rounded-xl border border-border bg-background/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead class="text-right">Quantité ajoutée</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="!isLoading && items.length === 0" :colspan="3">
                Aucun item — commence par en créer dans Inventaire.
              </TableEmpty>

              <TableRow v-if="isLoading">
                <TableCell colspan="3" class="text-muted-foreground"
                  >Chargement…</TableCell
                >
              </TableRow>

              <TableRow v-for="item in items" :key="item.id">
                <TableCell class="font-medium">{{ item.name }}</TableCell>
                <TableCell class="text-muted-foreground">{{
                  item.unit
                }}</TableCell>
                <TableCell class="text-right">
                  <NumberField v-model="quantities[item.id]" :min="1" :step="1">
                    <NumberFieldContent class="ml-auto w-32">
                      <NumberFieldDecrement />
                      <NumberFieldInput />
                      <NumberFieldIncrement />
                    </NumberFieldContent>
                  </NumberField>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <CardFooter class="flex flex-wrap items-center justify-between gap-2">
        <NuxtLink :to="`/companies/${companyId}/restocks`">
          <Button variant="ghost">Retour</Button>
        </NuxtLink>
        <Button
          class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
          :disabled="isSaving || items.length === 0"
          @click="onSubmit">
          <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
          <Save v-else class="mr-2 h-4 w-4" />
          {{ isSaving ? "Création..." : "Créer le restock" }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>

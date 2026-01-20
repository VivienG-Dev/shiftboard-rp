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
import { Loader2, Trash2 } from "lucide-vue-next";
import {
  useCompanyAnnual,
  type AnnualEntryRow,
} from "~/composables/useCompanyAnnual";

const route = useRoute();
const companyId = computed(() => String(route.params.companyId));

const { listAnnualEntries, createAnnualEntry, deleteAnnualEntry } =
  useCompanyAnnual();

const isLoading = ref(true);
const isSaving = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const rows = ref<AnnualEntryRow[]>([]);

const selectedYear = ref<number>(new Date().getFullYear());
const yearOptions = computed(() => {
  const current = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => current - 4 + i);
});

const form = reactive({
  date: "",
  revenue: "",
  expenses: "",
  startingCapital: "",
  total: "",
  itemsSold: "",
  profit: "",
  note: "",
});

function getTzOffsetMinutes() {
  return -new Date().getTimezoneOffset();
}

function formatMoney(value: number | null) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCount(value: number | null) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}

function sourceLabel(source: AnnualEntryRow["source"]) {
  return source === "MANUAL" ? "Manuel" : "Auto";
}

function toTrimmedString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseNumber(value: string) {
  const trimmed = toTrimmedString(value);
  if (!trimmed) return undefined;
  const num = Number(trimmed.replace(",", "."));
  return Number.isFinite(num) ? num : undefined;
}

function parseCount(value: string) {
  const trimmed = toTrimmedString(value);
  if (!trimmed) return undefined;
  const num = Number(trimmed);
  if (!Number.isFinite(num)) return undefined;
  return Math.max(0, Math.trunc(num));
}

async function refresh() {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const res = await listAnnualEntries(companyId.value, {
      year: selectedYear.value,
      tzOffsetMinutes: getTzOffsetMinutes(),
    });
    rows.value = res.data ?? [];
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger l'historique annuel.";
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
}

async function onCreate() {
  errorMessage.value = null;
  successMessage.value = null;
  if (!form.date) {
    errorMessage.value = "Choisis une date.";
    return;
  }

  isSaving.value = true;
  try {
    await createAnnualEntry(companyId.value, {
      date: form.date,
      revenue: parseNumber(form.revenue),
      expenses: parseNumber(form.expenses),
      startingCapital: parseNumber(form.startingCapital),
      total: parseNumber(form.total),
      itemsSold: parseCount(form.itemsSold),
      profit: parseNumber(form.profit),
      note: toTrimmedString(form.note) || undefined,
      tzOffsetMinutes: getTzOffsetMinutes(),
    });

    form.date = "";
    form.revenue = "";
    form.expenses = "";
    form.startingCapital = "";
    form.total = "";
    form.itemsSold = "";
    form.profit = "";
    form.note = "";

    successMessage.value = "Entrée enregistrée.";
    await refresh();
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible d'enregistrer l'entrée.";
    errorMessage.value = message;
  } finally {
    isSaving.value = false;
  }
}

async function onDelete(entry: AnnualEntryRow) {
  if (!entry.id) return;
  const ok = window.confirm("Supprimer cette entrée ?");
  if (!ok) return;
  errorMessage.value = null;
  successMessage.value = null;
  try {
    await deleteAnnualEntry(companyId.value, entry.id);
    successMessage.value = "Entrée supprimée.";
    await refresh();
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de supprimer l'entrée.";
    errorMessage.value = message;
  }
}

watch(selectedYear, () => refresh());
onMounted(refresh);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Historique annuel</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Suivi des revenus, dépenses et profits par jour.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <label class="text-sm text-muted-foreground">Année</label>
        <NativeSelect
          class="min-w-[120px]"
          :value="selectedYear"
          @change="
            selectedYear = Number(
              ($event.target as HTMLSelectElement).value
            )
          "
        >
          <option v-for="year in yearOptions" :key="year" :value="year">
            {{ year }}
          </option>
        </NativeSelect>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200"
    >
      {{ errorMessage }}
    </div>
    <div
      v-if="successMessage"
      class="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200"
    >
      {{ successMessage }}
    </div>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">Ajouter une entrée</CardTitle>
        <CardDescription>Ajoute ou corrige un jour précis.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Date</label>
            <Input v-model="form.date" type="date" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">CA / Revenu</label>
            <Input v-model="form.revenue" type="number" min="0" step="0.01" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Dépenses</label>
            <Input v-model="form.expenses" type="number" min="0" step="0.01" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Capital départ</label>
            <Input
              v-model="form.startingCapital"
              type="number"
              min="0"
              step="0.01"
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Total</label>
            <Input v-model="form.total" type="number" min="0" step="0.01" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Items vendus</label>
            <Input v-model="form.itemsSold" type="number" min="0" step="1" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Profit</label>
            <Input v-model="form.profit" type="number" step="0.01" />
          </div>
          <div class="space-y-2 md:col-span-2 lg:col-span-2">
            <label class="text-sm font-medium">Note</label>
            <Input v-model="form.note" placeholder="Optionnel" />
          </div>
        </div>

        <div class="flex justify-end">
          <Button
            class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
            :disabled="isSaving"
            @click="onCreate"
          >
            <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">Historique</CardTitle>
        <CardDescription>
          Les entrées manuelles remplacent les données automatiques.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="rounded-xl border border-border bg-background/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>CA / Revenu</TableHead>
                <TableHead>Dépenses</TableHead>
                <TableHead>Capital départ</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Items vendus</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Source</TableHead>
                <TableHead class="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="!isLoading && rows.length === 0" :colspan="9">
                Aucun historique pour cette année.
              </TableEmpty>
              <TableRow v-if="isLoading">
                <TableCell colspan="9" class="text-muted-foreground">
                  Chargement…
                </TableCell>
              </TableRow>
              <TableRow v-for="row in rows" :key="`${row.date}-${row.source}`">
                <TableCell class="font-medium">
                  {{ formatDate(row.date) }}
                </TableCell>
                <TableCell>{{ formatMoney(row.revenue) }}</TableCell>
                <TableCell>{{ formatMoney(row.expenses) }}</TableCell>
                <TableCell>{{ formatMoney(row.startingCapital) }}</TableCell>
                <TableCell>{{ formatMoney(row.total) }}</TableCell>
                <TableCell>{{ formatCount(row.itemsSold) }}</TableCell>
                <TableCell>{{ formatMoney(row.profit) }}</TableCell>
                <TableCell>{{ sourceLabel(row.source) }}</TableCell>
                <TableCell class="text-right">
                  <Button
                    v-if="row.source === 'MANUAL'"
                    variant="ghost"
                    size="sm"
                    class="text-red-200 hover:text-red-100"
                    @click="onDelete(row)"
                  >
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

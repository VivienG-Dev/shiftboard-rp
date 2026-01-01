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
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import { useCompanies } from "~/composables/useCompanies";
import { useCompanyInventory } from "~/composables/useCompanyInventory";
import { useCompanyShifts } from "~/composables/useCompanyShifts";
import type { CompanyLocation } from "~/composables/useCompanies";
import type { Item } from "~/composables/useCompanyInventory";
import type { SalesCard } from "~/composables/useCompanyShifts";
import {
  ClipboardList,
  Loader2,
  Play,
  Save,
  Square,
} from "lucide-vue-next";

const route = useRoute();
const companyId = computed(() => String(route.params.companyId));

const { listCompanyLocations } = useCompanies();
const { listItems } = useCompanyInventory();
const { getActiveSalesCard, startSalesCard, updateSalesCard, stopSalesCard, listSalesCards } =
  useCompanyShifts();

const locations = ref<CompanyLocation[]>([]);
const items = ref<Item[]>([]);
const activeCard = ref<SalesCard | null>(null);
const recentCards = ref<SalesCard[]>([]);

const isLoading = ref(true);
const isStarting = ref(false);
const isSaving = ref(false);
const isStopping = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const isStopDialogOpen = ref(false);

const startNote = ref("");
const startLocationId = ref<string>("");

const editNote = ref("");
const quantities = ref<Record<string, string | number | null | undefined>>({});

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function parseNonNegativeInt(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return NaN;
    if (!Number.isInteger(value) || value < 0) return NaN;
    return value;
  }

  const s = String(value);
  if (s.trim() === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return NaN;
  return n;
}

function safeTrim(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function hydrateFromCard(card: SalesCard | null) {
  activeCard.value = card;
  successMessage.value = null;
  if (!card) {
    editNote.value = "";
    quantities.value = {};
    return;
  }

  editNote.value = card.note ?? "";

  const next: Record<string, string> = {};
  for (const item of items.value) next[item.id] = "";
  for (const line of card.lines ?? []) {
    next[line.itemId] = String(line.quantitySold);
  }
  quantities.value = next;
}

async function loadAll() {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const [locRes, itemsRes, activeRes, cardsRes] = await Promise.all([
      listCompanyLocations(companyId.value),
      listItems(companyId.value, { activeOnly: true }),
      getActiveSalesCard(companyId.value),
      listSalesCards(companyId.value),
    ]);

    locations.value = locRes.data ?? [];
    items.value = (itemsRes.data ?? []).filter((i) => !i.archivedAt);
    recentCards.value = (cardsRes.data ?? []).slice(0, 10);

    hydrateFromCard(activeRes.data);
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger les shifts.";
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
}

async function onStart() {
  errorMessage.value = null;
  successMessage.value = null;
  isStarting.value = true;
  try {
    const res = await startSalesCard(companyId.value, {
      note: safeTrim(startNote.value) || undefined,
      locationId: safeTrim(startLocationId.value) || undefined,
    });
    startNote.value = "";
    startLocationId.value = "";
    hydrateFromCard(res.data);
    successMessage.value = "Shift démarré.";
    const cardsRes = await listSalesCards(companyId.value);
    recentCards.value = (cardsRes.data ?? []).slice(0, 10);
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de démarrer le shift.";
    errorMessage.value = message;
  } finally {
    isStarting.value = false;
  }
}

async function onSave() {
  if (!activeCard.value) return;
  errorMessage.value = null;
  successMessage.value = null;
  isSaving.value = true;
  try {
    const lines = Object.entries(quantities.value)
      .map(([itemId, qty]) => ({ itemId, quantitySold: parseNonNegativeInt(qty) }))
      .filter((l) => l.quantitySold !== null);

    if (lines.some((l) => Number.isNaN(l.quantitySold))) {
      throw new Error("Les quantités doivent être des entiers ≥ 0.");
    }

    const effectiveLines = (lines as Array<{ itemId: string; quantitySold: number }>).filter(
      (l) => l.quantitySold > 0
    );
    const totalSold = effectiveLines.reduce((sum, l) => sum + l.quantitySold, 0);

    const res = await updateSalesCard(companyId.value, activeCard.value.id, {
      note: safeTrim(editNote.value) || undefined,
      lines: lines as Array<{ itemId: string; quantitySold: number }>,
    });

    hydrateFromCard(res.data);
    successMessage.value =
      effectiveLines.length === 0
        ? "Sauvegardé — aucune vente enregistrée. Tu peux continuer ou stopper pour soumettre."
        : `Sauvegardé — ${totalSold} vente(s) sur ${effectiveLines.length} item(s). Tu peux continuer ou stopper pour soumettre.`;
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de sauvegarder le shift.";
    errorMessage.value = message;
  } finally {
    isSaving.value = false;
  }
}

async function onStop() {
  if (!activeCard.value) return;
  errorMessage.value = null;
  successMessage.value = null;
  isStopping.value = true;
  try {
    await stopSalesCard(companyId.value, activeCard.value.id);
    hydrateFromCard(null);
    successMessage.value = "Shift soumis.";
    const cardsRes = await listSalesCards(companyId.value);
    recentCards.value = (cardsRes.data ?? []).slice(0, 10);
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de stopper le shift.";
    errorMessage.value = message;
  } finally {
    isStopping.value = false;
  }
}

onMounted(loadAll);
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="flex items-center gap-2 text-3xl font-bold tracking-tight">
        <ClipboardList class="h-6 w-6" />
        Shifts
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Démarre un shift, renseigne les ventes, puis stoppe pour soumettre.
      </p>
    </div>

    <div v-if="errorMessage" class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" class="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200">
      {{ successMessage }}
    </div>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">Shift actif</CardTitle>
        <CardDescription v-if="activeCard">
          Démarré le {{ formatDate(activeCard.startAt) }}
          <span v-if="activeCard.location"> • {{ activeCard.location.name }}</span>
        </CardDescription>
        <CardDescription v-else>Aucun shift actif</CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <div v-if="isLoading" class="text-sm text-muted-foreground">Chargement…</div>

        <div v-else-if="!activeCard" class="grid gap-3 md:grid-cols-3">
          <Input v-model="startNote" placeholder="Note (optionnel)" />

          <NativeSelect v-model="startLocationId">
            <option value="">Aucun lieu</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">
              {{ loc.name }}
            </option>
          </NativeSelect>

          <Button
            class="bg-gradient-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
            :disabled="isStarting"
            @click="onStart"
          >
            <Loader2 v-if="isStarting" class="mr-2 h-4 w-4 animate-spin" />
            <Play v-else class="mr-2 h-4 w-4" />
            {{ isStarting ? "Démarrage..." : "Démarrer" }}
          </Button>
        </div>

        <div v-else class="space-y-4">
          <div class="grid gap-3 md:grid-cols-2">
            <Input v-model="editNote" placeholder="Note (optionnel)" />
            <div class="flex flex-wrap gap-2 md:justify-end">
              <Button variant="outline" :disabled="isSaving || isStopping" @click="onSave">
                <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
                <Save v-else class="mr-2 h-4 w-4" />
                Sauvegarder
              </Button>
              <Button
                class="bg-gradient-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
                :disabled="isStopping"
                @click="isStopDialogOpen = true"
              >
                <Loader2 v-if="isStopping" class="mr-2 h-4 w-4 animate-spin" />
                <Square v-else class="mr-2 h-4 w-4" />
                Stopper & soumettre
              </Button>
            </div>
          </div>

          <div class="rounded-xl border border-border bg-background/40">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Unité</TableHead>
                  <TableHead class="text-right">Quantité vendue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty v-if="items.length === 0" :colspan="3">
                  Aucun item — crée-en d'abord dans Inventaire.
                </TableEmpty>

                <TableRow v-for="item in items" :key="item.id">
                  <TableCell class="font-medium">{{ item.name }}</TableCell>
                  <TableCell class="text-muted-foreground">{{ item.unit }}</TableCell>
                  <TableCell class="text-right">
                    <NumberField v-model="quantities[item.id]" :min="0" :step="1">
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
        </div>
      </CardContent>

      <CardFooter />
    </Card>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">Derniers shifts</CardTitle>
        <CardDescription>Les 10 plus récents</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="rounded-xl border border-border bg-background/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Début</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Lieu</TableHead>
                <TableHead class="text-right">Lignes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty v-if="!isLoading && recentCards.length === 0" :colspan="4">
                Aucun shift
              </TableEmpty>

              <TableRow v-for="c in recentCards" :key="c.id">
                <TableCell class="font-medium">{{ formatDate(c.startAt) }}</TableCell>
                <TableCell class="text-muted-foreground">{{ c.status }}</TableCell>
                <TableCell class="text-muted-foreground">{{ c.location?.name ?? "—" }}</TableCell>
                <TableCell class="text-right text-muted-foreground">{{ c._count?.lines ?? c.lines?.length ?? 0 }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <AlertDialog v-model:open="isStopDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Stopper le shift ?</AlertDialogTitle>
          <AlertDialogDescription>
            Le shift passera en <span class="font-semibold">SUBMITTED</span> et impactera le stock (vendus depuis le snapshot).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isStopping">Annuler</AlertDialogCancel>
          <AlertDialogAction
            class="bg-gradient-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
            :disabled="isStopping"
            @click="onStop"
          >
            Confirmer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

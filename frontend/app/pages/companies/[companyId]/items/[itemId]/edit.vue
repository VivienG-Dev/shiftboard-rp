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
import { Loader2, Pencil } from "lucide-vue-next";
import { z } from "zod";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
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
import { useCompanyInventory } from "~/composables/useCompanyInventory";
import type { Item, ItemCategory } from "~/composables/useCompanyInventory";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const route = useRoute();
const router = useRouter();
const companyId = computed(() => String(route.params.companyId));
const itemId = computed(() => String(route.params.itemId));

const { listItems, updateItem, archiveItem } = useCompanyInventory();

const item = ref<Item | null>(null);
const isLoading = ref(true);
const generalError = ref<string | null>(null);
const isSaving = ref(false);
const isArchiving = ref(false);
const isArchiveDialogOpen = ref(false);

const categoryOptions: Array<{ value: ItemCategory; label: string }> = [
  { value: "DRINK", label: "Boisson" },
  { value: "SOFT_DRINK", label: "Soft" },
  { value: "ALCOHOL_DRINK", label: "Alcool" },
  { value: "BOTTLE", label: "Bouteille" },
  { value: "FOOD", label: "Nourriture" },
  { value: "OTHER", label: "Autre" },
];

const schema = toTypedSchema(
  z.object({
    name: z.string().min(1, "Le nom est requis").max(120, "Le nom est trop long"),
    category: z.enum(["DRINK", "SOFT_DRINK", "ALCOHOL_DRINK", "BOTTLE", "FOOD", "OTHER"]),
    unit: z.string().min(1, "L'unité est requise").max(32, "L'unité est trop longue"),
    basePrice: z
      .preprocess(
        (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
        z.number().min(0, "Prix invalide").nullable()
      ),
    lowStockThreshold: z
      .preprocess(
        (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
        z.number().int("Doit être un entier").min(0, "Seuil invalide").nullable()
      ),
  })
);

const form = useForm({
  validationSchema: schema,
  initialValues: {
    name: "",
    category: "BOTTLE" as ItemCategory,
    unit: "bottle",
    basePrice: "",
    lowStockThreshold: "",
  },
});

async function load() {
  isLoading.value = true;
  generalError.value = null;
  try {
    const res = await listItems(companyId.value, {
      includeArchived: true,
      activeOnly: false,
    });
    const found = (res.data ?? []).find((i) => i.id === itemId.value) ?? null;
    item.value = found;
    if (!found) {
      generalError.value = "Item introuvable.";
      return;
    }
    form.setValues({
      name: found.name,
      category: found.category,
      unit: found.unit,
      basePrice: found.basePrice ?? "",
      lowStockThreshold: found.lowStockThreshold ?? "",
    });
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger l'item.";
    generalError.value = message;
  } finally {
    isLoading.value = false;
  }
}

const onSubmit = form.handleSubmit(async (values) => {
  generalError.value = null;
  isSaving.value = true;
  try {
    await updateItem(companyId.value, itemId.value, {
      name: values.name,
      category: values.category,
      unit: values.unit,
      basePrice: values.basePrice,
      lowStockThreshold: values.lowStockThreshold,
    });
    router.push(`/companies/${companyId.value}/items`);
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de sauvegarder l'item.";
    generalError.value = message;
  } finally {
    isSaving.value = false;
  }
});

async function onArchive() {
  if (!item.value || item.value.archivedAt) return;
  generalError.value = null;
  isArchiving.value = true;
  try {
    await archiveItem(companyId.value, itemId.value);
    router.push(`/companies/${companyId.value}/items`);
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible d'archiver l'item.";
    generalError.value = message;
  } finally {
    isArchiving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Modifier un item</h1>
      <p class="mt-1 text-sm text-muted-foreground">Mets à jour les infos de l'item.</p>
    </div>

    <div v-if="generalError" class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
      {{ generalError }}
    </div>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="flex items-center gap-2 text-xl">
          <Pencil class="h-5 w-5" />
          Édition
        </CardTitle>
        <CardDescription v-if="item">ID: {{ item.id }}</CardDescription>
      </CardHeader>

      <CardContent>
        <div v-if="isLoading" class="text-sm text-muted-foreground">Chargement…</div>

        <form v-else class="space-y-4" @submit.prevent="onSubmit">
          <FormField v-slot="{ componentField }" name="name">
            <FormItem>
              <FormLabel>Nom <span class="text-red-400">*</span></FormLabel>
              <FormControl>
                <Input v-bind="componentField" placeholder="Ex: Vodka" autocomplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <div class="grid gap-4 md:grid-cols-2">
            <FormField v-slot="{ field }" name="category">
              <FormItem>
                <FormLabel>Catégorie <span class="text-red-400">*</span></FormLabel>
                <FormControl>
                  <NativeSelect v-bind="field">
                    <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </NativeSelect>
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="unit">
              <FormItem>
                <FormLabel>Unité <span class="text-red-400">*</span></FormLabel>
                <FormControl>
                  <Input v-bind="componentField" placeholder="Ex: bottle" autocomplete="off" />
                </FormControl>
                <FormDescription>Exemples: bottle, glass, piece.</FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <FormField v-slot="{ componentField }" name="basePrice">
              <FormItem>
                <FormLabel>Prix</FormLabel>
                <FormControl>
                  <Input v-bind="componentField" type="number" min="0" placeholder="Ex: 250" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="lowStockThreshold">
              <FormItem>
                <FormLabel>Seuil stock faible</FormLabel>
                <FormControl>
                  <Input v-bind="componentField" type="number" min="0" placeholder="Ex: 3" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <Button
            class="w-full bg-gradient-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
            type="submit"
            :disabled="isSaving"
          >
            <Loader2 v-if="isSaving" class="w-4 h-4 mr-2 animate-spin" />
            {{ isSaving ? "Sauvegarde..." : "Sauvegarder" }}
          </Button>
        </form>
      </CardContent>

      <CardFooter class="flex flex-wrap items-center justify-between gap-2">
        <NuxtLink :to="`/companies/${companyId}/items`">
          <Button variant="ghost">Retour</Button>
        </NuxtLink>
        <Button
          v-if="item && !item.archivedAt"
          variant="outline"
          :disabled="isArchiving"
          @click="isArchiveDialogOpen = true"
        >
          <Loader2 v-if="isArchiving" class="w-4 h-4 mr-2 animate-spin" />
          Archiver
        </Button>
      </CardFooter>
    </Card>

    <AlertDialog v-model:open="isArchiveDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archiver l'item ?</AlertDialogTitle>
          <AlertDialogDescription>
            <span v-if="item">“{{ item.name }}”</span> ne sera plus sélectionnable pour les nouveaux snapshots/restocks/shifts.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isArchiving">Annuler</AlertDialogCancel>
          <AlertDialogAction
            class="bg-gradient-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
            :disabled="isArchiving"
            @click="onArchive"
          >
            Archiver
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

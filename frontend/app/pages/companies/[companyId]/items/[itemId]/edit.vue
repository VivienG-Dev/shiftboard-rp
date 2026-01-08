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

const { listItems, updateItem } = useCompanyInventory();

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
    name: z
      .string()
      .min(1, "Le nom est requis")
      .max(120, "Le nom est trop long"),
    category: z.enum([
      "DRINK",
      "SOFT_DRINK",
      "ALCOHOL_DRINK",
      "BOTTLE",
      "FOOD",
      "OTHER",
    ]),
    unit: z
      .string()
      .min(1, "L'unité est requise")
      .max(32, "L'unité est trop longue"),
    basePrice: z.preprocess(
      (v) =>
        v === "" || v === null || v === undefined ? undefined : Number(v),
      z.number().min(0, "Prix invalide").optional()
    ),
    lowStockThreshold: z.preprocess(
      (v) =>
        v === "" || v === null || v === undefined ? undefined : Number(v),
      z.number().int("Doit être un entier").min(0, "Seuil invalide").optional()
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

const item = ref<Item | null>(null);
const generalError = ref<string | null>(null);
const isLoading = ref(true);
const isSaving = ref(false);

async function loadItem() {
  isLoading.value = true;
  generalError.value = null;
  try {
    const res = await listItems(companyId.value, {
      includeArchived: true,
      activeOnly: false,
    });
    item.value = (res.data ?? []).find((i) => i.id === itemId.value) ?? null;
    if (!item.value) {
      generalError.value = "Item introuvable.";
      return;
    }
    form.setValues({
      name: item.value.name,
      category: item.value.category,
      unit: item.value.unit,
      basePrice: item.value.basePrice ?? "",
      lowStockThreshold: item.value.lowStockThreshold ?? "",
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
      "Impossible de mettre à jour l'item. Réessaie.";
    generalError.value = message;
  } finally {
    isSaving.value = false;
  }
});

onMounted(loadItem);
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Modifier un item</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Mets à jour les informations de l’item.
      </p>
    </div>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="flex items-center gap-2 text-xl">
          <Pencil class="h-5 w-5" />
          Édition
        </CardTitle>
        <CardDescription>Champs principaux</CardDescription>
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
                <FormLabel>Prix (optionnel)</FormLabel>
                <FormControl>
                  <Input v-bind="componentField" type="number" min="0" placeholder="Ex: 250" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="lowStockThreshold">
              <FormItem>
                <FormLabel>Seuil stock faible (optionnel)</FormLabel>
                <FormControl>
                  <Input v-bind="componentField" type="number" min="0" placeholder="Ex: 3" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <div
            v-if="generalError"
            class="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200"
          >
            {{ generalError }}
          </div>

          <Button
            class="w-full bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
            type="submit"
            :disabled="isSaving || isLoading"
          >
            <Loader2 v-if="isSaving" class="w-4 h-4 mr-2 animate-spin" />
            {{ isSaving ? "Enregistrement..." : "Enregistrer" }}
          </Button>
        </form>
      </CardContent>

      <CardFooter class="flex justify-between">
        <NuxtLink :to="`/companies/${companyId}/items`">
          <Button variant="ghost">Retour</Button>
        </NuxtLink>
      </CardFooter>
    </Card>
  </div>
</template>


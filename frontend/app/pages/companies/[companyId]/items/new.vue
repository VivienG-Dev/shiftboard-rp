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
import { Loader2, PackagePlus } from "lucide-vue-next";
import { z } from "zod";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { useCompanyInventory } from "~/composables/useCompanyInventory";
import type { ItemCategory } from "~/composables/useCompanyInventory";
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

const { createItem } = useCompanyInventory();

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
      .max(32, "Le conditionnement est trop long")
      .optional(),
    basePrice: z.preprocess(
      (v) =>
        v === "" || v === null || v === undefined ? undefined : Number(v),
      z.number().min(0, "Prix invalide").optional()
    ),
    costPrice: z.preprocess(
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
    basePrice: "",
    costPrice: "",
    lowStockThreshold: "",
  },
});

const generalError = ref<string | null>(null);
const isLoading = ref(false);

const onSubmit = form.handleSubmit(async (values) => {
  generalError.value = null;
  isLoading.value = true;
  try {
    await createItem(companyId.value, {
      name: values.name,
      category: values.category,
      basePrice: values.basePrice,
      costPrice: values.costPrice,
      lowStockThreshold: values.lowStockThreshold,
    });
    router.push(`/companies/${companyId.value}/items`);
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de créer l'item. Réessaie.";
    generalError.value = message;
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Ajouter un item</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Crée un item (bouteille, boisson, nourriture…). Tu pourras ensuite faire
        un snapshot pour le stock.
      </p>
    </div>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="flex items-center gap-2 text-xl">
          <PackagePlus class="h-5 w-5" />
          Nouvel item
        </CardTitle>
        <CardDescription>Champs principaux</CardDescription>
      </CardHeader>

      <CardContent>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <FormField v-slot="{ componentField }" name="name">
            <FormItem>
              <FormLabel>Nom <span class="text-red-400">*</span></FormLabel>
              <FormControl>
                <Input
                  v-bind="componentField"
                  placeholder="Ex: Vodka"
                  autocomplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <div class="grid gap-4 md:grid-cols-2">
            <FormField v-slot="{ field }" name="category">
              <FormItem>
                <FormLabel
                  >Catégorie <span class="text-red-400">*</span></FormLabel
                >
                <FormControl>
                  <NativeSelect v-bind="field">
                    <option
                      v-for="opt in categoryOptions"
                      :key="opt.value"
                      :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </NativeSelect>
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <FormField v-slot="{ componentField }" name="basePrice">
              <FormItem>
                <FormLabel>Prix de vente (optionnel)</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    type="number"
                    min="0"
                    placeholder="Ex: 250" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="costPrice">
              <FormItem>
                <FormLabel>Prix d'achat (optionnel)</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    type="number"
                    min="0"
                    placeholder="Ex: 120" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="lowStockThreshold">
              <FormItem>
                <FormLabel>Seuil stock faible (optionnel)</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    type="number"
                    min="0"
                    placeholder="Ex: 3" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <div
            v-if="generalError"
            class="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {{ generalError }}
          </div>

          <Button
            class="w-full bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
            type="submit"
            :disabled="isLoading">
            <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
            {{ isLoading ? "Création..." : "Créer l'item" }}
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

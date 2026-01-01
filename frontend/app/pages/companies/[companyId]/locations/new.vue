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
import { Loader2 } from "lucide-vue-next";
import { MapPin } from "lucide-vue-next";
import { z } from "zod";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { useCompanies } from "~/composables/useCompanies";
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

const { createCompanyLocation } = useCompanies();

const schema = toTypedSchema(
  z.object({
    name: z
      .string()
      .min(1, "Le nom du lieu est requis")
      .max(120, "Le nom est trop long"),
  })
);

const form = useForm({
  validationSchema: schema,
  initialValues: { name: "" },
});

const generalError = ref<string | null>(null);
const isLoading = ref(false);

const onSubmit = form.handleSubmit(async (values) => {
  generalError.value = null;
  isLoading.value = true;
  try {
    await createCompanyLocation(companyId.value, { name: values.name });
    router.push(`/companies/${companyId.value}/locations`);
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de créer le lieu. Réessaie.";
    generalError.value = message;
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Ajouter un lieu</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Exemple: “Los Santos”, “Paris”, “New York”… Un lieu représente une
        branche.
      </p>
    </div>

    <Card class="w-full border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="flex items-center gap-2 text-xl">
          <MapPin class="h-5 w-5" />
          Nouveau lieu
        </CardTitle>
        <CardDescription
          >Crée un lieu pour organiser les shifts et filtres.</CardDescription
        >
      </CardHeader>

      <CardContent>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <FormField v-slot="{ componentField }" name="name">
            <FormItem>
              <FormLabel>Nom <span class="text-red-400">*</span></FormLabel>
              <FormControl>
                <Input
                  v-bind="componentField"
                  placeholder="Ex: Los Santos"
                  autocomplete="off" />
              </FormControl>
              <FormDescription>
                Utilise un nom court et clair. Tu pourras en ajouter plusieurs.
              </FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>

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
            {{ isLoading ? "Création..." : "Créer le lieu" }}
          </Button>
        </form>
      </CardContent>

      <CardFooter class="flex justify-between">
        <NuxtLink :to="`/companies/${companyId}/locations`">
          <Button variant="ghost">Retour</Button>
        </NuxtLink>
      </CardFooter>
    </Card>
  </div>
</template>

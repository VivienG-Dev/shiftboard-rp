<script setup lang="ts">
definePageMeta({
  middleware: "auth",
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
import { useAuth } from "~/composables/useAuth";
import { useCompanies } from "~/composables/useCompanies";
import type { CompanyType } from "~/composables/useCompanies";
import { z } from "zod";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { ref } from "vue";
import { Loader2 } from "lucide-vue-next";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const router = useRouter();
const { signOut } = useAuth();
const { createCompany } = useCompanies();

const typeOptions: Array<{ value: CompanyType; label: string }> = [
  { value: "BAR", label: "Bar" },
  { value: "CLUB", label: "Club" },
  { value: "FAST_FOOD", label: "Fast-food" },
  { value: "OTHER", label: "Autre" },
];

const schema = toTypedSchema(
  z.object({
    name: z
      .string()
      .min(1, "Le nom est requis")
      .max(120, "Le nom est trop long"),
    type: z.enum(["BAR", "CLUB", "FAST_FOOD", "OTHER"], {
      required_error: "Le type est requis",
    }),
    slug: z
      .string()
      .max(64, "Le slug est trop long")
      .optional()
      .transform((v) => (v?.trim() ? v.trim() : undefined)),
  })
);

const form = useForm({
  validationSchema: schema,
  initialValues: {
    name: "",
    type: "BAR" as CompanyType,
    slug: "",
  },
});

const generalError = ref<string | null>(null);
const isLoading = ref(false);

const onSubmit = form.handleSubmit(async (values) => {
  generalError.value = null;
  isLoading.value = true;
  try {
    await createCompany({
      name: values.name,
      type: values.type,
      slug: values.slug,
    });
    router.push("/companies");
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de créer l'entreprise. Réessaie.";
    generalError.value = message;
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b border-border bg-background/70 backdrop-blur">
      <div
        class="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-6 py-5">
        <NuxtLink
          to="/companies"
          class="flex items-center gap-3 hover:opacity-95">
          <div
            class="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-tr from-cyan-400 to-pink-500 text-xs font-black text-slate-950">
            SB
          </div>
          <div>
            <div class="text-sm font-semibold tracking-tight">
              Créer une entreprise
            </div>
            <div class="text-xs text-slate-400">
              Étape 1 — configuration de base
            </div>
          </div>
        </NuxtLink>

        <div class="flex items-center gap-2">
          <NuxtLink to="/me">
            <Button variant="ghost">Profil</Button>
          </NuxtLink>
          <Button variant="ghost" @click="signOut"> Déconnexion </Button>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-7xl px-6 py-10">
      <Card class="mx-auto w-full max-w-xl border-border bg-card/60">
        <CardHeader class="space-y-1">
          <CardTitle class="text-2xl">Nouvelle entreprise</CardTitle>
          <CardDescription>
            Crée ton bar/club, puis tu pourras ajouter des lieux, du staff et
            l’inventaire.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form class="space-y-4" @submit.prevent="onSubmit">
            <FormField v-slot="{ componentField }" name="name">
              <FormItem>
                <FormLabel>Nom <span class="text-red-400">*</span></FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    placeholder="Ex: Vanilla Unicorn"
                    autocomplete="organization" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ field }" name="type">
              <FormItem>
                <FormLabel>Type <span class="text-red-400">*</span></FormLabel>
                <FormControl>
                  <NativeSelect v-bind="field">
                    <option
                      v-for="opt in typeOptions"
                      :key="opt.value"
                      :value="opt.value"
                      class="bg-background text-foreground">
                      {{ opt.label }}
                    </option>
                  </NativeSelect>
                </FormControl>
                <FormDescription>
                  Utilisé pour les futurs templates et permissions par défaut.
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="slug">
              <FormItem>
                <FormLabel>Slug (optionnel)</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    placeholder="Ex: vanilla-unicorn"
                    autocomplete="off" />
                </FormControl>
                <FormDescription>
                  Laisse vide pour générer automatiquement à partir du nom.
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
              {{ isLoading ? "Création..." : "Créer l'entreprise" }}
            </Button>
          </form>
        </CardContent>

        <CardFooter class="flex justify-between">
          <NuxtLink to="/companies">
            <Button variant="ghost" class="text-slate-200">Retour</Button>
          </NuxtLink>
        </CardFooter>
      </Card>
    </main>
  </div>
</template>

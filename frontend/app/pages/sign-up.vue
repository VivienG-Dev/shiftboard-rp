<script setup lang="ts">
definePageMeta({
  layout: "auth",
  ssr: false,
});

import { useAuth } from "~/composables/useAuth";
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
import { ref } from "vue";
import { Eye, EyeOff, Loader2 } from "lucide-vue-next";
import { z } from "zod";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const router = useRouter();
const { signUpEmail, isAuthenticated } = useAuth();

const schema = toTypedSchema(
  z.object({
    name: z
      .string()
      .min(2, "Le nom est requis")
      .max(50, "Le nom est trop long"),
    email: z
      .string()
      .min(1, "L'email est requis")
      .email("Adresse email invalide"),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .max(72, "Le mot de passe est trop long"),
  })
);

const form = useForm({
  validationSchema: schema,
  initialValues: {
    name: "",
    email: "",
    password: "",
  },
});

const generalError = ref<string | null>(null);
const isPasswordVisible = ref(false);
const isLoading = ref(false);

const onSubmit = form.handleSubmit(async (values) => {
  generalError.value = null;
  isLoading.value = true;

  try {
    await signUpEmail(values.name, values.email, values.password);
    form.resetForm();
    router.push(isAuthenticated.value ? "/companies" : "/sign-in");
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "La création du compte a échoué. Réessaie.";
    generalError.value = message;
  } finally {
    isLoading.value = false;
  }
});

const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value;
};
</script>

<template>
  <div
    class="relative min-h-screen overflow-hidden bg-linear-to-br from-background via-muted/40 to-background text-foreground">
    <div
      class="pointer-events-none absolute inset-0 [background:radial-gradient(1000px_circle_at_15%_10%,rgba(34,211,238,0.18),transparent_55%),radial-gradient(900px_circle_at_85%_35%,rgba(225,29,72,0.14),transparent_55%)]" />

    <div class="relative z-10 grid min-h-screen lg:grid-cols-2">
      <!-- Left: form -->
      <div class="flex items-center justify-center px-6 py-10">
        <div class="w-full max-w-md">
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <span
              class="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-tr from-cyan-400 to-pink-500 text-xs font-black text-slate-950">
              SB
            </span>
            <span class="font-semibold tracking-tight">ShiftBoard RP</span>
          </NuxtLink>

          <Card class="mt-6 border-border bg-card/60 shadow-xl backdrop-blur">
            <CardHeader class="space-y-1">
              <CardTitle class="text-2xl">Créer un compte</CardTitle>
              <CardDescription>
                Configure ton profil et commence à gérer ton bar.
              </CardDescription>
            </CardHeader>

            <CardContent class="grid gap-4">
              <form @submit.prevent="onSubmit" class="space-y-4">
                <FormField v-slot="{ componentField }" name="name">
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input
                        v-bind="componentField"
                        placeholder="Ton nom"
                        autocomplete="name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="email">
                  <FormItem>
                    <FormLabel>Adresse email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        v-bind="componentField"
                        placeholder="vous@exemple.com"
                        autocomplete="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="password">
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <div class="relative">
                        <Input
                          :type="isPasswordVisible ? 'text' : 'password'"
                          v-bind="componentField"
                          autocomplete="new-password" />
                        <div
                          class="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <Eye
                            v-if="isPasswordVisible"
                            @click="togglePasswordVisibility"
                            class="h-4 w-4 text-muted-foreground cursor-pointer" />
                          <EyeOff
                            v-else
                            @click="togglePasswordVisibility"
                            class="h-4 w-4 text-muted-foreground cursor-pointer" />
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <div
                  v-if="generalError"
                  class="text-center text-red-500 text-sm">
                  {{ generalError }}
                </div>

                <Button
                  class="w-full bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
                  type="submit"
                  :disabled="isLoading">
                  <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                  {{ isLoading ? "Création en cours..." : "Créer un compte" }}
                </Button>
              </form>
            </CardContent>

            <CardFooter
              class="flex flex-wrap items-center justify-between gap-2">
              <NuxtLink
                class="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                to="/">
                Retour à l'accueil
              </NuxtLink>
              <NuxtLink
                class="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                to="/sign-in">
                Déjà un compte ?
              </NuxtLink>
            </CardFooter>
          </Card>
        </div>
      </div>

      <!-- Right: visual -->
      <div class="relative hidden lg:block">
        <div
          class="absolute inset-0 bg-[url('/images/ls-skyline.svg')] bg-cover bg-center opacity-80" />
        <div
          class="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div class="relative h-full p-10">
          <div class="max-w-lg">
            <h2 class="text-4xl font-bold tracking-tight">Rejoins l'équipe</h2>
            <p class="mt-4 text-muted-foreground">
              Crée une entreprise, invite l'équipe et garde ton inventaire à
              jour, shift après shift.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

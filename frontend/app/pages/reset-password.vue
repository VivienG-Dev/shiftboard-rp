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
import { ref, computed } from "vue";
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
const route = useRoute();
const { resetPassword } = useAuth();

const token = computed(() =>
  route.query.token ? String(route.query.token) : ""
);

const schema = toTypedSchema(
  z
    .object({
      password: z.string().min(8, "8 caracteres minimum"),
      confirmPassword: z.string().min(1, "Confirmation requise"),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: "Les mots de passe ne correspondent pas",
      path: ["confirmPassword"],
    })
);

const form = useForm({
  validationSchema: schema,
  initialValues: {
    password: "",
    confirmPassword: "",
  },
});

const generalError = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const isLoading = ref(false);
const isPasswordVisible = ref(false);
const isConfirmVisible = ref(false);

const onSubmit = form.handleSubmit(async (values) => {
  generalError.value = null;
  successMessage.value = null;

  if (!token.value) {
    generalError.value =
      "Lien invalide ou expire. Recommence la reinitialisation.";
    return;
  }

  isLoading.value = true;
  try {
    await resetPassword(token.value, values.password);
    form.resetForm();
    successMessage.value = "Mot de passe mis a jour. Tu peux te connecter.";
  } catch (error: unknown) {
    generalError.value =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "La reinitialisation a echoue. Reessaie.";
  } finally {
    isLoading.value = false;
  }
});

const goToSignIn = () => {
  router.push("/sign-in");
};
</script>

<template>
  <div
    class="relative min-h-screen overflow-hidden bg-linear-to-br from-background via-muted/40 to-background text-foreground">
    <div
      class="pointer-events-none absolute inset-0 [background:radial-gradient(1000px_circle_at_15%_10%,rgba(34,211,238,0.18),transparent_55%),radial-gradient(900px_circle_at_85%_35%,rgba(225,29,72,0.14),transparent_55%)]" />

    <div class="relative z-10 grid min-h-screen lg:grid-cols-2">
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
              <CardTitle class="text-2xl">Nouveau mot de passe</CardTitle>
              <CardDescription>
                Choisis un mot de passe solide pour ton compte.
              </CardDescription>
            </CardHeader>

            <CardContent class="grid gap-4">
              <form @submit.prevent="onSubmit" class="space-y-4">
                <FormField v-slot="{ componentField }" name="password">
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <div class="relative">
                        <Input
                          :type="isPasswordVisible ? 'text' : 'password'"
                          v-bind="componentField" />
                        <div
                          class="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <Eye
                            v-if="isPasswordVisible"
                            @click="isPasswordVisible = !isPasswordVisible"
                            class="h-4 w-4 text-muted-foreground cursor-pointer" />
                          <EyeOff
                            v-else
                            @click="isPasswordVisible = !isPasswordVisible"
                            class="h-4 w-4 text-muted-foreground cursor-pointer" />
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="confirmPassword">
                  <FormItem>
                    <FormLabel>Confirmer le mot de passe</FormLabel>
                    <FormControl>
                      <div class="relative">
                        <Input
                          :type="isConfirmVisible ? 'text' : 'password'"
                          v-bind="componentField" />
                        <div
                          class="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <Eye
                            v-if="isConfirmVisible"
                            @click="isConfirmVisible = !isConfirmVisible"
                            class="h-4 w-4 text-muted-foreground cursor-pointer" />
                          <EyeOff
                            v-else
                            @click="isConfirmVisible = !isConfirmVisible"
                            class="h-4 w-4 text-muted-foreground cursor-pointer" />
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <div
                  v-if="successMessage"
                  class="text-center text-emerald-400 text-sm">
                  {{ successMessage }}
                </div>

                <div
                  v-if="generalError"
                  class="text-center text-red-500 text-sm">
                  {{ generalError }}
                </div>

                <Button
                  class="w-full bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
                  type="submit"
                  :disabled="isLoading || !token">
                  <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                  {{ isLoading ? "Mise a jour..." : "Mettre a jour" }}
                </Button>
              </form>
            </CardContent>

            <CardFooter class="flex items-center justify-between gap-2">
              <NuxtLink
                class="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                to="/sign-in">
                Retour a la connexion
              </NuxtLink>
              <Button
                variant="ghost"
                class="text-sm text-muted-foreground hover:text-foreground"
                type="button"
                @click="goToSignIn">
                Se connecter
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div class="relative hidden lg:block">
        <div
          class="absolute inset-0 bg-[url('/images/ls-skyline.svg')] bg-cover bg-center opacity-80" />
        <div
          class="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div class="relative h-full p-10">
          <div class="max-w-lg">
            <h2 class="text-4xl font-bold tracking-tight">
              Nouveau depart pour ton crew
            </h2>
            <p class="mt-4 text-muted-foreground">
              Un mot de passe fort, et la nuit repart propre.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "blank",
});
// import GoogleAuthButton from "@/components/GoogleAuthButton.vue";
import { ChevronLeft } from "lucide-vue-next";
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
// import { useAuthStore } from "@/stores/authStore";
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
const authStore = useAuthStore();
const { googleAuthEnabled } = useRuntimeConfig().public;

// Define the schema for our form
const schema = toTypedSchema(
  z.object({
    email: z
      .string()
      .min(1, "Email est requis")
      .email("Adresse email invalide"),
    name: z
      .string()
      .regex(
        /^[a-zA-Z][a-zA-Z0-9_-]*$/,
        "Le nom d'utilisateur doit commencer par une lettre et ne peut contenir que des lettres, des chiffres, des underscores et des traits de soulignement"
      )
      .min(1, "Le nom d'utilisateur est requis")
      .min(4, "Le nom d'utilisateur doit contenir au moins 4 caractères")
      .max(50, "Le nom d'utilisateur ne doit pas dépasser 50 caractères"),
    password: z
      .string()
      .min(1, "Le mot de passe est requis")
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .max(20, "Le mot de passe ne doit pas dépasser 20 caractères")
      .refine(
        (val) => /[A-Za-z]/.test(val),
        "Le mot de passe doit contenir au moins une lettre"
      )
      .refine(
        (val) => /\d/.test(val),
        "Le mot de passe doit contenir au moins un chiffre"
      )
      .refine(
        (val) => /[@$!%*#?&]/.test(val),
        "Le mot de passe doit contenir au moins un caractère spécial (@$!%*#?&)"
      ),
  })
);

const form = useForm({
  validationSchema: schema,
  initialValues: {
    email: "",
    name: "",
    password: "",
  },
});

const generalError = ref<string | null>(null);
const isPasswordVisible = ref(false);
const successMessage = ref<string | null>(null);
const isLoading = ref(false);

const onSubmit = form.handleSubmit(async (values) => {
  generalError.value = null;
  isLoading.value = true;

  try {
    await authStore.signup(values.email, values.name, values.password);
    form.resetForm();
    successMessage.value =
      "Compte créé avec succès. Vérifie ton email pour activer ton compte.";
    setTimeout(() => {
      router.push("/sign-in");
    }, 3000);
  } catch (error) {
    if (error instanceof AxiosError) {
      // Handle Axios errors (including the 409 Conflict error)
      console.error("Axios error during signup", error.response?.data);
      if (error.response?.status === 409) {
        if (error.response.data.message === "Email already exists") {
          form.setFieldError(
            "email",
            "Cette adresse email est déjà enregistrée"
          );
        } else if (error.response.data.message === "Username already exists") {
          form.setFieldError("name", "Ce nom d'utilisateur est déjà pris");
        } else {
          generalError.value =
            error.response.data.message ||
            "Une erreur est survenue lors de la création du compte";
        }
      } else {
        generalError.value =
          "La création du compte a échoué. Réessaye plus tard.";
      }
    } else {
      console.error("Unexpected error during signup", error);
      generalError.value = "Une erreur inattendue est survenue. Réessaye.";
    }
  } finally {
    isLoading.value = false;
  }
});

const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value;
};

const handleGoogleSignup = () => {
  if (!googleAuthEnabled) return;
  window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
};

const title = "Créer un compte | Manga Hive";
const description =
  "Rejoins Manga Hive aujourd'hui pour commencer à gérer ta collection de mangas, suivre tes lectures et te connecter avec d'autres fans.";

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: "/og-image.jpg",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <div class="h-screen flex flex-col md:flex-row">
    <div
      class="h-full relative md:w-1/2 xl:w-11/12 flex flex-col items-center justify-center">
      <RouterLink
        to="/"
        class="absolute top-10 left-5 md:left-10 bg-white dark:text-background p-1 shadow hover:scale-125 transition ease-in-out duration-300 rounded-full">
        <ChevronLeft class="w-7 h-7" />
      </RouterLink>
      <Card
        class="w-full max-w-md bg-background dark:bg-background border-none shadow-none md:shadow-none">
        <CardHeader class="space-y-1 text-center">
          <CardTitle class="text-2xl"> Créer un compte </CardTitle>
          <CardDescription class="text-gray-500 dark:text-gray-400">
            Entre ton email ci-dessous pour créer ton compte
          </CardDescription>
        </CardHeader>
        <CardContent class="grid gap-4">
          <!-- <div class="grid grid-cols-1 gap-6">
            <GoogleAuthButton action="sign-up" @click="handleGoogleSignup" />
          </div> -->
          <div class="grid grid-cols-1 gap-2">
            <p class="text-center text-sm text-gray-500 dark:text-gray-400">
              <span class="font-bold">Google</span> créera un compte
              automatiquement
            </p>
            <GoogleAuthButton action="sign-up" @click="handleGoogleSignup" />
          </div>
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t border-muted-foreground" />
            </div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-background px-2 text-muted-foreground">
                Ou continue avec
              </span>
            </div>
          </div>
          <form @submit="onSubmit" class="space-y-4">
            <FormField v-slot="{ componentField }" name="email">
              <FormItem>
                <FormLabel>Email <span class="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input
                    class="bg-white dark:bg-gray-800"
                    type="email"
                    v-bind="componentField"
                    placeholder="m@example.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            <FormField v-slot="{ componentField }" name="name">
              <FormItem>
                <FormLabel
                  >Nom d'utilisateur
                  <span class="text-red-500">*</span></FormLabel
                >
                <FormControl>
                  <Input
                    class="bg-white dark:bg-gray-800"
                    type="name"
                    v-bind="componentField"
                    placeholder="Nom d'utilisateur" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            <FormField v-slot="{ componentField }" name="password">
              <FormItem>
                <FormLabel
                  >Mot de passe <span class="text-red-500">*</span></FormLabel
                >
                <FormControl>
                  <div class="relative">
                    <Input
                      class="bg-white dark:bg-gray-800"
                      :type="isPasswordVisible ? 'text' : 'password'"
                      v-bind="componentField" />
                    <div
                      class="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Eye
                        v-if="isPasswordVisible"
                        @click="togglePasswordVisibility"
                        class="h-4 w-4 text-gray-500 cursor-pointer" />
                      <EyeOff
                        v-else
                        @click="togglePasswordVisibility"
                        class="h-4 w-4 text-gray-500 cursor-pointer" />
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            <div v-if="generalError" class="text-center text-red-500 text-sm">
              {{ generalError }}
            </div>
            <div
              v-if="successMessage"
              class="text-center text-green-500 text-sm">
              {{ successMessage }}
            </div>
            <Button class="w-full" type="submit" :disabled="isLoading">
              <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
              {{ isLoading ? "Création en cours..." : "Créer mon compte" }}
            </Button>
          </form>
        </CardContent>
        <CardFooter class="flex justify-center">
          <p class="text-muted-foreground text-sm">Tu as déjà un compte ?</p>
          <RouterLink to="/sign-in"
            ><Button variant="link"> Connexion !</Button></RouterLink
          >
        </CardFooter>
      </Card>
    </div>

    <div
      class="h-96 md:h-screen hidden md:flex items-center justify-center bg-cover bg-no-repeat bg-bottom md:w-1/2 xl:1/12 p-8 bg-sign-up"></div>
  </div>
</template>

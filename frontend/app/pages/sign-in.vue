<script setup lang="ts">
definePageMeta({
  layout: "blank",
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
const { signInEmail } = useAuth();

// Define the schema for our form
const schema = toTypedSchema(
  z.object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  })
);

const form = useForm({
  validationSchema: schema,
  initialValues: {
    email: "",
    password: "",
  },
});

const generalError = ref<string | null>(null);
const isPasswordVisible = ref(false);
const isLoading = ref(false);

const onSubmit = form.handleSubmit(async (values) => {
  console.log("onSubmit", values);
  generalError.value = null;
  isLoading.value = true;

  try {
    await signInEmail(values.email, values.password);
    form.resetForm();
    router.push("/");
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Sign in failed. Please check your credentials and try again.";
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
  <div class="min-h-screen flex items-center justify-center p-6">
    <Card class="w-full max-w-md">
      <CardHeader class="space-y-1 text-center">
        <CardTitle class="text-2xl">Sign in</CardTitle>
        <CardDescription>Use your email and password</CardDescription>
      </CardHeader>

      <CardContent class="grid gap-4">
        <form @submit.prevent="onSubmit" class="space-y-4">
          <FormField v-slot="{ componentField }" name="email">
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  v-bind="componentField"
                  placeholder="you@example.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="password">
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div class="relative">
                  <Input
                    :type="isPasswordVisible ? 'text' : 'password'"
                    v-bind="componentField" />
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

          <div v-if="generalError" class="text-center text-red-500 text-sm">
            {{ generalError }}
          </div>

          <Button class="w-full" type="submit" :disabled="isLoading">
            <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
            {{ isLoading ? "Signing in..." : "Sign in" }}
          </Button>
        </form>
      </CardContent>

      <CardFooter class="flex justify-center">
        <NuxtLink class="text-sm underline" to="/">Back to home</NuxtLink>
      </CardFooter>
    </Card>
  </div>
</template>

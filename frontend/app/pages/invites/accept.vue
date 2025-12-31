<script setup lang="ts">
definePageMeta({
  layout: "blank",
  ssr: false,
});

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCompanyTeam } from "~/composables/useCompanyTeam";
import { CheckCircle2, Loader2, Ticket } from "lucide-vue-next";

const router = useRouter();
const { acceptInvite } = useCompanyTeam();

const code = ref("");
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

async function onSubmit() {
  errorMessage.value = null;
  successMessage.value = null;
  isLoading.value = true;
  try {
    const res = await acceptInvite(code.value.trim());
    successMessage.value = "Invitation acceptée.";
    setTimeout(() => {
      router.push(`/companies/${res.data.companyId}`);
    }, 800);
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible d'accepter l'invitation.";
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
    <Card class="w-full max-w-md border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="flex items-center gap-2 text-2xl">
          <Ticket class="h-5 w-5" />
          Accepter une invitation
        </CardTitle>
        <CardDescription>Entre le code reçu (ex: ABC123).</CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <Input v-model="code" placeholder="Code" autocomplete="off" />
        <div v-if="errorMessage" class="text-sm text-red-500">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 class="h-4 w-4" />
          {{ successMessage }}
        </div>
        <Button
          class="w-full bg-gradient-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
          :disabled="isLoading || !code.trim()"
          @click="onSubmit"
        >
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ isLoading ? "Validation..." : "Valider" }}
        </Button>
      </CardContent>

      <CardFooter class="justify-center">
        <NuxtLink class="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4" to="/companies">
          Retour
        </NuxtLink>
      </CardFooter>
    </Card>
  </div>
</template>


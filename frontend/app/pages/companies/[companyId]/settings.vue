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
import type { Company, CompanyType } from "~/composables/useCompanies";
import { useCompanies } from "~/composables/useCompanies";
import { Loader2, Settings } from "lucide-vue-next";

const route = useRoute();
const router = useRouter();
const companyId = computed(() => String(route.params.companyId));

const { getCompany, updateCompany, archiveCompany } = useCompanies();

const company = ref<Company | null>(null);
const isLoading = ref(true);
const isSaving = ref(false);
const isArchiving = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const archiveDialogOpen = ref(false);

const name = ref("");
const slug = ref("");
const type = ref<CompanyType>("OTHER");

const companyTypes: Array<{ value: CompanyType; label: string }> = [
  { value: "BAR", label: "Bar" },
  { value: "CLUB", label: "Club" },
  { value: "FAST_FOOD", label: "Fast-food" },
  { value: "OTHER", label: "Autre" },
];

function syncForm(c: Company) {
  name.value = c.name ?? "";
  slug.value = c.slug ?? "";
  type.value = c.type ?? "OTHER";
}

function normalizeSlug(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

async function refresh() {
  isLoading.value = true;
  errorMessage.value = null;
  successMessage.value = null;
  try {
    const res = await getCompany(companyId.value);
    company.value = res.data;
    syncForm(res.data);
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger l'entreprise.";
    errorMessage.value = message;
  } finally {
    isLoading.value = false;
  }
}

async function onSave() {
  if (!company.value) return;
  errorMessage.value = null;
  successMessage.value = null;
  isSaving.value = true;
  try {
    const res = await updateCompany(companyId.value, {
      name: name.value.trim(),
      slug: normalizeSlug(slug.value),
      type: type.value,
    });
    company.value = res.data;
    syncForm(res.data);
    successMessage.value = "Paramètres enregistrés.";
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible d'enregistrer les paramètres.";
    errorMessage.value = message;
  } finally {
    isSaving.value = false;
  }
}

async function onArchive() {
  errorMessage.value = null;
  successMessage.value = null;
  isArchiving.value = true;
  try {
    await archiveCompany(companyId.value);
    archiveDialogOpen.value = false;
    await router.push("/companies");
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible d'archiver l'entreprise.";
    errorMessage.value = message;
  } finally {
    isArchiving.value = false;
  }
}

onMounted(refresh);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Settings class="h-6 w-6" />
          Paramètres
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Nom, slug et type de l'entreprise.
        </p>
      </div>

      <Button variant="outline" @click="refresh" :disabled="isLoading">
        <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
        Actualiser
      </Button>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
      {{ errorMessage }}
    </div>
    <div
      v-if="successMessage"
      class="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200">
      {{ successMessage }}
    </div>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">Entreprise</CardTitle>
        <CardDescription>Ces champs sont visibles dans l'app.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div v-if="isLoading" class="text-sm text-muted-foreground">
          Chargement…
        </div>
        <div v-else class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-sm font-medium">Nom</label>
            <Input v-model="name" placeholder="Nom de l'entreprise" />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">Type</label>
            <NativeSelect v-model="type">
              <option v-for="t in companyTypes" :key="t.value" :value="t.value">
                {{ t.label }}
              </option>
            </NativeSelect>
          </div>

          <div class="space-y-2 md:col-span-2">
            <label class="text-sm font-medium">Slug (optionnel)</label>
            <Input v-model="slug" placeholder="ex: vanilla-unicorn" />
            <p class="text-xs text-muted-foreground">
              Laisse vide pour supprimer le slug.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter class="flex justify-end">
        <Button
          class="bg-linear-to-r from-cyan-400 to-pink-500 text-slate-950 hover:from-cyan-300 hover:to-pink-400"
          :disabled="isSaving || isLoading || !name.trim()"
          @click="onSave">
          <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
          Enregistrer
        </Button>
      </CardFooter>
    </Card>

    <Card class="border-destructive/30 bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">Zone dangereuse</CardTitle>
        <CardDescription>Action irréversible (pour l'instant).</CardDescription>
      </CardHeader>
      <CardContent class="text-sm text-muted-foreground">
        Archiver l'entreprise la rendra inaccessible via l'app.
      </CardContent>
      <CardFooter class="flex justify-end">
        <Button variant="destructive" @click="archiveDialogOpen = true">
          Archiver l'entreprise
        </Button>
      </CardFooter>
    </Card>

    <AlertDialog :open="archiveDialogOpen" @update:open="archiveDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archiver l’entreprise ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action va désactiver l’accès à l’entreprise pour tous les membres.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isArchiving">Annuler</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="isArchiving"
            @click="onArchive"
          >
            <Loader2 v-if="isArchiving" class="mr-2 h-4 w-4 animate-spin" />
            Archiver
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

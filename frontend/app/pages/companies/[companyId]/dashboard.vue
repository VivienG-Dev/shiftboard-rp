<script setup lang="ts">
definePageMeta({
  middleware: "auth",
  layout: "company",
  ssr: false,
});

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, DollarSign, ClipboardList, Users } from "lucide-vue-next";
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Aperçu</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Structure inspirée des dashboards shadcn-vue — on branchera ensuite les KPIs, inventaire et shifts.
        </p>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card class="border-border bg-card/60">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign class="h-4 w-4" />
            Ventes (24h)
          </CardTitle>
        </CardHeader>
        <CardContent class="text-2xl font-semibold">$0</CardContent>
      </Card>
      <Card class="border-border bg-card/60">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-sm text-muted-foreground">
            <ClipboardList class="h-4 w-4" />
            Shifts
          </CardTitle>
        </CardHeader>
        <CardContent class="text-2xl font-semibold">0</CardContent>
      </Card>
      <Card class="border-border bg-card/60">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle class="h-4 w-4" />
            Stock faible
          </CardTitle>
        </CardHeader>
        <CardContent class="text-2xl font-semibold">0</CardContent>
      </Card>
      <Card class="border-border bg-card/60">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-sm text-muted-foreground">
            <Users class="h-4 w-4" />
            Staff
          </CardTitle>
        </CardHeader>
        <CardContent class="text-2xl font-semibold">0</CardContent>
      </Card>
    </div>

    <div class="grid gap-4 lg:grid-cols-7">
      <Card class="border-border bg-card/60 lg:col-span-4">
        <CardHeader>
          <CardTitle class="text-base">Activité</CardTitle>
        </CardHeader>
        <CardContent class="text-sm text-muted-foreground">
          Placeholder graphique (sales by hour, etc.).
        </CardContent>
      </Card>
      <Card class="border-border bg-card/60 lg:col-span-3">
        <CardHeader>
          <CardTitle class="text-base">Derniers shifts</CardTitle>
        </CardHeader>
        <CardContent class="text-sm text-muted-foreground">
          Placeholder liste des shifts récents.
        </CardContent>
      </Card>
    </div>
  </div>
</template>

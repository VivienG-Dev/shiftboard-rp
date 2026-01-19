<script setup lang="ts">
definePageMeta({
  middleware: "auth",
  layout: "company",
  ssr: false,
});

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCompanyInventory } from "~/composables/useCompanyInventory";
import { useCompanyShifts } from "~/composables/useCompanyShifts";
import type { SalesCard } from "~/composables/useCompanyShifts";
import { useCompanyTeam } from "~/composables/useCompanyTeam";
import { useCompanyStats } from "~/composables/useCompanyStats";
import type { SalesBucket } from "~/composables/useCompanyStats";
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltipContent,
  componentToString,
} from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  VisXYContainer,
  VisArea,
  VisAxis,
  VisLine,
  VisLineSelectors,
  VisTooltip,
  VisCrosshair,
} from "@unovis/vue";
import {
  AlertTriangle,
  DollarSign,
  ClipboardList,
  Users,
  TrendingUp,
  Loader2,
} from "lucide-vue-next";

const route = useRoute();
const companyId = computed(() => String(route.params.companyId));

const { getStock } = useCompanyInventory();
const { listSalesCards } = useCompanyShifts();
const { listMembers } = useCompanyTeam();
const { getKpis, getSales, getSalesTimeseries } = useCompanyStats();

type RangeKey = "24H" | "7D" | "30D";
const range = ref<RangeKey>("7D");
const bucket = ref<SalesBucket>("hour");

const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

const colorMode = useColorMode();

const revenue = ref<number>(0);
const itemsSold = ref<number>(0);
const activeStaff = ref<number>(0);
const lowStock = ref<number>(0);
const recentCards = ref<SalesCard[]>([]);
const salesByDayLocation = ref<
  Array<{
    day: string;
    locationName: string;
    revenue: number;
    itemsSold: number;
  }>
>([]);

type ChartPoint = {
  x: number;
  label: string;
  revenue: number;
  itemsSold: number;
};
const series = ref<ChartPoint[]>([]);
const supportsKpisApi = ref(true);
const supportsChartsApi = ref(true);

function startOfRange(now: Date, key: RangeKey) {
  const start = new Date(now);
  if (key === "24H") start.setHours(start.getHours() - 24);
  else if (key === "7D") start.setDate(start.getDate() - 7);
  else start.setDate(start.getDate() - 30);
  return start;
}

function startOfChartRange(now: Date, bucket: SalesBucket) {
  const start = new Date(now);
  if (bucket === "hour") start.setHours(start.getHours() - 24);
  else if (bucket === "day") start.setDate(start.getDate() - 30);
  else start.setMonth(start.getMonth() - 12);
  return start;
}

function clampToNumber(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function computeFromCards(cards: SalesCard[]) {
  const valid = cards.filter(
    (c) => c.status === "SUBMITTED" || c.status === "LOCKED"
  );
  const activeStaffCount = new Set(valid.map((c) => c.userId)).size;

  let totalRevenue = 0;
  let totalItemsSold = 0;
  for (const card of valid) {
    for (const line of card.lines ?? []) {
      const qty = clampToNumber(line.quantitySold);
      totalItemsSold += qty;
      const lineTotal =
        clampToNumber(line.total) || clampToNumber(line.unitPrice) * qty;
      totalRevenue += lineTotal;
    }
  }

  return { totalRevenue, totalItemsSold, activeStaffCount };
}

function buildHourlySeries(cards: SalesCard[]) {
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hh = String(i).padStart(2, "0");
    return { x: i, label: `${hh}h`, revenue: 0, itemsSold: 0 };
  });

  for (const card of cards) {
    if (card.status !== "SUBMITTED" && card.status !== "LOCKED") continue;
    const date = new Date(card.startAt);
    const hour = date.getHours();
    if (!Number.isFinite(hour) || hour < 0 || hour > 23) continue;

    for (const line of card.lines ?? []) {
      const qty = clampToNumber(line.quantitySold);
      hours[hour]!.itemsSold += qty;
      const lineTotal =
        clampToNumber(line.total) || clampToNumber(line.unitPrice) * qty;
      hours[hour]!.revenue += lineTotal;
    }
  }

  return hours;
}

function getTzOffsetMinutes() {
  // JS returns minutes to add to local -> UTC. We need minutes to add to UTC -> local.
  // Paris winter: getTimezoneOffset() = -60, backend expects +60.
  return String(-new Date().getTimezoneOffset());
}

function formatDayLabel(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(date);
}

function formatMonthLabel(value: string) {
  const date = new Date(`${value}-01T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getLocalDayKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toLocaleDateString("fr-CA");
}

function buildSalesByDayLocation(cards: SalesCard[]) {
  const map = new Map<
    string,
    { day: string; locationName: string; revenue: number; itemsSold: number }
  >();

  for (const card of cards) {
    if (card.status !== "SUBMITTED" && card.status !== "LOCKED") continue;
    const day = getLocalDayKey(card.startAt);
    const locationName = card.location?.name ?? "Sans lieu";
    const key = `${day}__${locationName}`;

    const current = map.get(key) ?? {
      day,
      locationName,
      revenue: 0,
      itemsSold: 0,
    };

    for (const line of card.lines ?? []) {
      const qty = clampToNumber(line.quantitySold);
      current.itemsSold += qty;
      const lineTotal =
        clampToNumber(line.total) || clampToNumber(line.unitPrice) * qty;
      current.revenue += lineTotal;
    }

    map.set(key, current);
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.day === b.day) return a.locationName.localeCompare(b.locationName);
    return b.day.localeCompare(a.day);
  });
}

const revenueColor = computed(() =>
  colorMode.value === "dark" ? "hsl(188 92% 55%)" : "hsl(188 92% 42%)"
);

const chartConfig = computed(() => ({
  revenue: { label: "Revenu", color: revenueColor.value },
}));

const tooltipRenderer = componentToString(
  chartConfig.value as any,
  ChartTooltipContent as any,
  {
    labelFormatter: (x: number | Date) => {
      const n = typeof x === "number" ? x : Number(x);
      if (!Number.isFinite(n)) return "—";
      const idx = Math.round(n);
      return series.value[idx]?.label ?? "—";
    },
  }
);

const tooltipTrigger = computed(() => {
  if (!tooltipRenderer) return undefined;
  return {
    [`.${VisLineSelectors.lineSelectionHelper}`]: (d: any) =>
      tooltipRenderer(d, d?.x ?? 0),
  } as Record<string, any>;
});

async function refresh() {
  isLoading.value = true;
  errorMessage.value = null;

  const now = new Date();
  const from = startOfRange(now, range.value).toISOString();
  const to = now.toISOString();
  const tzOffsetMinutes = getTzOffsetMinutes();
  const chartFrom = startOfChartRange(now, bucket.value).toISOString();

  try {
    const [stockRes, recentRes, rangeSalesRes] = await Promise.all([
      getStock(companyId.value),
      listSalesCards(companyId.value),
      listSalesCards(companyId.value, { from, to }),
    ]);

    lowStock.value = (stockRes.data ?? []).filter((r) => r.isLowStock).length;
    recentCards.value = (recentRes.data ?? []).slice(0, 6);
    salesByDayLocation.value = buildSalesByDayLocation(rangeSalesRes.data ?? []);
  } catch (error: unknown) {
    const message =
      (error as any)?.data?.message ||
      (error as any)?.message ||
      "Impossible de charger le dashboard.";
    errorMessage.value = message;
  }

  // KPIs: prefer dedicated endpoint; fallback to aggregating sales-cards.
  try {
    if (supportsKpisApi.value) {
      const kpiRes = await getKpis(companyId.value, { from, to });
      revenue.value = clampToNumber(kpiRes.data.revenue);
      itemsSold.value = clampToNumber(kpiRes.data.itemsSold);
      activeStaff.value = clampToNumber(kpiRes.data.activeStaff);
    } else {
      throw new Error("KPIs endpoint disabled");
    }
  } catch (error: unknown) {
    // Disable future calls when backend doesn't implement it (404).
    const status = (error as any)?.status ?? (error as any)?.response?.status;
    if (status === 404) supportsKpisApi.value = false;
    try {
      const cardsRes = await listSalesCards(companyId.value, { from, to });
      const computed = computeFromCards(cardsRes.data ?? []);
      revenue.value = computed.totalRevenue;
      itemsSold.value = computed.totalItemsSold;
      activeStaff.value = computed.activeStaffCount;
    } catch {
      // ignore, handled by main error banner
    }
  }

  // Chart: prefer dedicated endpoint; fallback to aggregating sales-cards.
  try {
    if (!supportsChartsApi.value) throw new Error("Charts endpoint disabled");

    if (bucket.value === "hour") {
      const tsRes = await getSalesTimeseries(companyId.value, {
        from: chartFrom,
        to,
        tzOffsetMinutes,
      });
      const rows = tsRes.data ?? [];
      series.value = rows.map((r, idx) => {
        const d = new Date(r.ts);
        const label = Number.isNaN(d.getTime())
          ? r.ts
          : new Intl.DateTimeFormat("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            }).format(d);
        return {
          x: idx,
          label,
          revenue: clampToNumber(r.revenue),
          itemsSold: clampToNumber(r.itemsSold),
        };
      });
      if (series.value.length === 0) {
        series.value = buildHourlySeries(recentCards.value);
      }
    } else if (bucket.value === "day") {
      const chartRes = await getSales(companyId.value, bucket.value, {
        from: chartFrom,
        to,
        tzOffsetMinutes,
      });
      const rows = (chartRes.data as any[]).filter(
        (r) => typeof r.day === "string"
      );
      series.value = rows.map((r, idx) => ({
        x: idx,
        label: formatDayLabel(r.day),
        revenue: clampToNumber(r.revenue),
        itemsSold: clampToNumber(r.itemsSold),
      }));
    } else {
      const chartRes = await getSales(companyId.value, bucket.value, {
        from: chartFrom,
        to,
        tzOffsetMinutes,
      });
      const rows = (chartRes.data as any[]).filter(
        (r) => typeof r.month === "string"
      );
      series.value = rows.map((r, idx) => ({
        x: idx,
        label: formatMonthLabel(r.month),
        revenue: clampToNumber(r.revenue),
        itemsSold: clampToNumber(r.itemsSold),
      }));
    }
  } catch (error: unknown) {
    const status = (error as any)?.status ?? (error as any)?.response?.status;
    if (status === 404) supportsChartsApi.value = false;
    try {
      const cardsRes = await listSalesCards(companyId.value, { from: chartFrom, to });
      series.value = buildHourlySeries(cardsRes.data ?? []);
    } catch {
      series.value = buildHourlySeries(recentCards.value);
    }
  }

  // Staff fallback if KPIs missing (activeStaff = members count).
  if (activeStaff.value === 0) {
    try {
      const membersRes = await listMembers(companyId.value);
      activeStaff.value = (membersRes.data ?? []).length;
    } catch {
      // ignore
    }
  }

  isLoading.value = false;
}

watch([range, bucket], () => refresh());
onMounted(refresh);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Aperçu</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          KPIs et activité basés sur les shifts (sales cards) et le stock.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <select
          v-model="range"
          class="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          aria-label="Période">
          <option value="24H">24 heures</option>
          <option value="7D">7 jours</option>
          <option value="30D">30 jours</option>
        </select>
        <Button variant="outline" @click="refresh" :disabled="isLoading">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          Actualiser
        </Button>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
      {{ errorMessage }}
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card class="border-border bg-card/60">
        <CardHeader class="pb-2">
          <CardTitle
            class="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign class="h-4 w-4" />
            Revenu
          </CardTitle>
        </CardHeader>
        <CardContent class="text-2xl font-semibold">
          <Skeleton v-if="isLoading" class="h-8 w-28" />
          <span v-else>{{ formatMoney(revenue) }}</span>
        </CardContent>
      </Card>
      <Card class="border-border bg-card/60">
        <CardHeader class="pb-2">
          <CardTitle
            class="flex items-center gap-2 text-sm text-muted-foreground">
            <ClipboardList class="h-4 w-4" />
            Items vendus
          </CardTitle>
        </CardHeader>
        <CardContent class="text-2xl font-semibold">
          <Skeleton v-if="isLoading" class="h-8 w-20" />
          <span v-else>{{ itemsSold.toLocaleString("fr-FR") }}</span>
        </CardContent>
      </Card>
      <Card class="border-border bg-card/60">
        <CardHeader class="pb-2">
          <CardTitle
            class="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle class="h-4 w-4" />
            Stock faible
          </CardTitle>
        </CardHeader>
        <CardContent class="text-2xl font-semibold">
          <Skeleton v-if="isLoading" class="h-8 w-14" />
          <span v-else>{{ lowStock.toLocaleString("fr-FR") }}</span>
        </CardContent>
      </Card>
      <Card class="border-border bg-card/60">
        <CardHeader class="pb-2">
          <CardTitle
            class="flex items-center gap-2 text-sm text-muted-foreground">
            <Users class="h-4 w-4" />
            Staff
          </CardTitle>
        </CardHeader>
        <CardContent class="text-2xl font-semibold">
          <Skeleton v-if="isLoading" class="h-8 w-12" />
          <span v-else>{{ activeStaff.toLocaleString("fr-FR") }}</span>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 lg:grid-cols-7">
      <Card class="border-border bg-card/60 lg:col-span-4">
        <CardHeader class="space-y-2 px-4 py-3 sm:space-y-3 sm:px-6 sm:py-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <CardTitle class="flex items-center gap-2 text-base">
              <TrendingUp class="h-4 w-4" />
              Activité
            </CardTitle>

            <Tabs v-model="bucket" class="w-full sm:w-auto">
              <TabsList
                class="grid h-8 w-full grid-cols-3 text-xs sm:h-10 sm:w-[320px] sm:text-sm">
                <TabsTrigger value="hour" class="h-7 sm:h-9"
                  >Heures</TabsTrigger
                >
                <TabsTrigger value="day" class="h-7 sm:h-9">Jours</TabsTrigger>
                <TabsTrigger value="month" class="h-7 sm:h-9">Mois</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent class="px-4 pb-4 sm:px-6 sm:pb-6">
          <div class="h-40 sm:h-64">
            <Skeleton v-if="isLoading" class="h-full w-full" />
            <ChartContainer
              v-else
              :config="chartConfig as any"
              class="h-full"
              cursor>
              <template #default>
                <VisXYContainer
                  :data="series"
                  class="h-full"
                  :margin="{ left: 8, right: 8, top: 8, bottom: 8 }">
                  <VisAxis
                    type="x"
                    position="bottom"
                    :x="(d: any) => d.x"
                    :tickFormat="(t: any) => series[Math.round(Number(t))]?.label ?? ''"
                    :gridLine="false" />
                  <VisAxis
                    type="y"
                    position="left"
                    :tickFormat="(t: any) => t.toLocaleString('fr-FR')"
                    :gridLine="true" />
                  <VisArea
                    :x="(d: any) => d.x"
                    :y="(d: any) => d.revenue"
                    :color="() => revenueColor"
                    :opacity="() => 0.22" />
                  <VisLine
                    :x="(d: any) => d.x"
                    :y="(d: any) => d.revenue"
                    :lineWidth="2"
                    :color="() => revenueColor" />
                  <VisCrosshair
                    :x="(d: any) => d.x"
                    :y="(d: any) => d.revenue" />
                  <VisTooltip
                    v-if="tooltipTrigger"
                    :triggers="tooltipTrigger"
                    :followCursor="true" />
                </VisXYContainer>
                <ChartLegendContent class="justify-start" />
              </template>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
      <Card class="border-border bg-card/60 lg:col-span-3">
        <CardHeader class="px-4 py-3 sm:px-6 sm:py-4">
          <CardTitle class="text-base">Derniers shifts</CardTitle>
        </CardHeader>
        <CardContent
          class="space-y-2 px-4 pb-4 sm:space-y-3 sm:px-6 sm:pb-6">
          <div v-if="isLoading" class="space-y-2">
            <Skeleton class="h-10 w-full sm:h-12" />
            <Skeleton class="h-10 w-full sm:h-12" />
            <Skeleton class="h-10 w-full sm:h-12" />
          </div>
          <div
            v-else-if="recentCards.length === 0"
            class="text-sm text-muted-foreground">
            Aucun shift
          </div>
          <div v-else class="space-y-1.5 sm:space-y-2">
            <NuxtLink
              v-for="card in recentCards"
              :key="card.id"
              :to="`/companies/${companyId}/sales-cards/${card.id}`"
              class="block rounded-lg border border-border bg-background/40 px-2 py-1 text-[13px] hover:bg-accent/30 sm:px-3 sm:py-2 sm:text-sm">
              <div class="flex items-center justify-between gap-3">
                <div class="font-medium">
                  {{ formatDate(card.startAt) }}
                </div>
                <div class="text-[11px] text-muted-foreground sm:text-xs">
                  {{ card.status }}
                </div>
              </div>
              <div class="mt-1 text-xs text-muted-foreground">
                {{ card.note || "—" }}
              </div>
            </NuxtLink>
          </div>

          <div class="pt-2">
            <NuxtLink :to="`/companies/${companyId}/sales-cards`">
              <Button variant="outline" size="sm" class="w-full"
                >Voir tous les rapports</Button
              >
            </NuxtLink>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card class="border-border bg-card/60">
      <CardHeader class="space-y-1">
        <CardTitle class="text-lg">Recettes par jour & lieu</CardTitle>
        <CardDescription
          >Total journalier par lieu sur la période sélectionnée.</CardDescription
        >
      </CardHeader>
      <CardContent>
        <div class="rounded-xl border border-border bg-background/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Lieu</TableHead>
                <TableHead>Items vendus</TableHead>
                <TableHead class="text-right">Revenu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableEmpty
                v-if="!isLoading && salesByDayLocation.length === 0"
                :colspan="4">
                Aucun revenu sur la période.
              </TableEmpty>

              <TableRow v-if="isLoading">
                <TableCell colspan="4" class="text-muted-foreground"
                  >Chargement…</TableCell
                >
              </TableRow>

              <TableRow
                v-for="row in salesByDayLocation"
                :key="`${row.day}-${row.locationName}`">
                <TableCell class="font-medium">{{
                  formatDayLabel(row.day)
                }}</TableCell>
                <TableCell class="text-muted-foreground">{{
                  row.locationName
                }}</TableCell>
                <TableCell class="text-muted-foreground">{{
                  row.itemsSold.toLocaleString("fr-FR")
                }}</TableCell>
                <TableCell class="text-right font-medium">{{
                  formatMoney(row.revenue)
                }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

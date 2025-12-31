export type CompanyKpis = {
  from: string | null;
  to: string | null;
  revenue: number;
  activeStaff: number;
  itemsSold: number;
};

export type SalesByHourRow = {
  hour: number;
  revenue: number;
  itemsSold: number;
};

export type SalesByDayRow = {
  day: string; // YYYY-MM-DD
  revenue: number;
  itemsSold: number;
};

export type SalesByMonthRow = {
  month: string; // YYYY-MM
  revenue: number;
  itemsSold: number;
};

export type SalesBucket = "hour" | "day" | "month";

type DataResponse<T> = { data: T };
type ListResponse<T> = { data: T[] };

type DateRangeQuery = {
  from?: string;
  to?: string;
  tzOffsetMinutes?: string;
};

export function useCompanyStats() {
  const runtimeConfig = useRuntimeConfig();
  const backendUrl = normalizeBackendUrl(
    runtimeConfig.public.backendUrl as string | undefined
  );

  const requestHeaders = import.meta.server
    ? useRequestHeaders(["cookie", "user-agent"])
    : undefined;

  const apiFetch = $fetch.create({
    baseURL: backendUrl,
    credentials: "include",
    headers: requestHeaders,
  });

  async function getKpis(companyId: string, query: DateRangeQuery = {}) {
    return apiFetch<DataResponse<CompanyKpis>>(`/companies/${companyId}/kpis`, {
      query,
    });
  }

  async function getSalesByHour(companyId: string, query: DateRangeQuery = {}) {
    return apiFetch<ListResponse<SalesByHourRow>>(
      `/companies/${companyId}/charts/sales-by-hour`,
      { query }
    );
  }

  async function getSalesByDay(companyId: string, query: DateRangeQuery = {}) {
    return apiFetch<ListResponse<SalesByDayRow>>(
      `/companies/${companyId}/charts/sales-by-day`,
      { query }
    );
  }

  async function getSalesByMonth(companyId: string, query: DateRangeQuery = {}) {
    return apiFetch<ListResponse<SalesByMonthRow>>(
      `/companies/${companyId}/charts/sales-by-month`,
      { query }
    );
  }

  async function getSales(
    companyId: string,
    bucket: SalesBucket,
    query: DateRangeQuery = {}
  ) {
    return apiFetch<ListResponse<SalesByHourRow | SalesByDayRow | SalesByMonthRow>>(
      `/companies/${companyId}/charts/sales`,
      {
        query: { ...query, bucket },
      }
    );
  }

  return { getKpis, getSalesByHour, getSalesByDay, getSalesByMonth, getSales };
}

function normalizeBackendUrl(value?: string) {
  const fallback = "http://localhost:3000";
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/\/$/, "");
}

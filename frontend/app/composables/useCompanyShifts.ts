import type { ItemCategory } from "~/composables/useCompanyInventory";

export type SalesCardStatus = "DRAFT" | "SUBMITTED" | "LOCKED";

export type SalesCardLocation = { id: string; name: string } | null;

export type SalesCardLine = {
  id: string;
  salesCardId: string;
  itemId: string;
  quantitySold: number;
  unitPrice: unknown;
  total: unknown;
  item: { id: string; name: string; unit: string; category: ItemCategory };
};

export type SalesCard = {
  id: string;
  companyId: string;
  userId: string;
  roleId: string;
  locationId: string | null;
  status: SalesCardStatus;
  startAt: string;
  endAt: string | null;
  note: string | null;
  location: SalesCardLocation;
  lines: SalesCardLine[];
  _count?: { lines: number };
};

type ListResponse<T> = { data: T[] };
type DataResponse<T> = { data: T };

type StartSalesCardInput = {
  note?: string;
  roleId?: string;
  locationId?: string;
  startAt?: string;
};

type UpdateSalesCardInput = {
  note?: string;
  lines?: Array<{ itemId: string; quantitySold: number }>;
};

type StopSalesCardInput = { endAt?: string };

type ListSalesCardsQuery = {
  from?: string;
  to?: string;
  status?: SalesCardStatus;
  userId?: string;
};

export function useCompanyShifts() {
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

  async function listSalesCards(companyId: string, query: ListSalesCardsQuery = {}) {
    return apiFetch<ListResponse<SalesCard>>(`/companies/${companyId}/sales-cards`, {
      query,
    });
  }

  async function getActiveSalesCard(companyId: string) {
    return apiFetch<DataResponse<SalesCard | null>>(
      `/companies/${companyId}/sales-cards/active`
    );
  }

  async function startSalesCard(companyId: string, input: StartSalesCardInput = {}) {
    return apiFetch<DataResponse<SalesCard>>(`/companies/${companyId}/sales-cards/start`, {
      method: "POST",
      body: input,
    });
  }

  async function getSalesCard(companyId: string, cardId: string) {
    return apiFetch<DataResponse<SalesCard>>(
      `/companies/${companyId}/sales-cards/${cardId}`
    );
  }

  async function updateSalesCard(companyId: string, cardId: string, input: UpdateSalesCardInput) {
    return apiFetch<DataResponse<SalesCard>>(
      `/companies/${companyId}/sales-cards/${cardId}`,
      { method: "PATCH", body: input }
    );
  }

  async function stopSalesCard(companyId: string, cardId: string, input: StopSalesCardInput = {}) {
    return apiFetch<DataResponse<SalesCard>>(
      `/companies/${companyId}/sales-cards/${cardId}/stop`,
      { method: "POST", body: input }
    );
  }

  async function lockSalesCard(companyId: string, cardId: string) {
    return apiFetch<DataResponse<SalesCard>>(
      `/companies/${companyId}/sales-cards/${cardId}/lock`,
      { method: "POST" }
    );
  }

  return {
    listSalesCards,
    getActiveSalesCard,
    startSalesCard,
    getSalesCard,
    updateSalesCard,
    stopSalesCard,
    lockSalesCard,
  };
}

function normalizeBackendUrl(value?: string) {
  const fallback = "http://localhost:3000";
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/\/$/, "");
}

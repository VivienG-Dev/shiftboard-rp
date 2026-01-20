export type AnnualEntrySource = "AUTO" | "MANUAL";

export type AnnualEntryRow = {
  id: string | null;
  date: string;
  revenue: number | null;
  expenses: number | null;
  startingCapital: number | null;
  total: number | null;
  itemsSold: number | null;
  profit: number | null;
  source: AnnualEntrySource;
};

type ListResponse<T> = { data: T[] };
type DataResponse<T> = { data: T };

export type ListAnnualParams = {
  year?: number;
  tzOffsetMinutes?: number;
};

export type CreateAnnualEntryInput = {
  date: string;
  revenue?: number;
  expenses?: number;
  startingCapital?: number;
  total?: number;
  itemsSold?: number;
  profit?: number;
  note?: string;
  tzOffsetMinutes?: number;
};

export function useCompanyAnnual() {
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

  async function listAnnualEntries(companyId: string, params?: ListAnnualParams) {
    return apiFetch<ListResponse<AnnualEntryRow>>(
      `/companies/${companyId}/annual`,
      { params }
    );
  }

  async function createAnnualEntry(
    companyId: string,
    input: CreateAnnualEntryInput
  ) {
    return apiFetch<DataResponse<AnnualEntryRow>>(
      `/companies/${companyId}/annual`,
      {
        method: "POST",
        body: input,
      }
    );
  }

  async function deleteAnnualEntry(companyId: string, entryId: string) {
    return apiFetch<DataResponse<{ id: string }>>(
      `/companies/${companyId}/annual/${entryId}`,
      { method: "DELETE" }
    );
  }

  return {
    listAnnualEntries,
    createAnnualEntry,
    deleteAnnualEntry,
  };
}

function normalizeBackendUrl(value?: string) {
  const fallback = "http://localhost:3000";
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/\/$/, "");
}

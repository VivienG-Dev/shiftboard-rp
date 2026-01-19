export type MenuEntryType = "ITEM" | "CUSTOM";

export type MenuEntry = {
  id: string;
  companyId: string;
  type: MenuEntryType;
  itemId: string | null;
  name: string;
  price: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ListResponse<T> = { data: T[] };
type DataResponse<T> = { data: T };

type CreateMenuEntryInput =
  | { itemId: string }
  | { name: string; price: number };

export function useCompanyMenu() {
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

  async function listMenuEntries(companyId: string) {
    return apiFetch<ListResponse<MenuEntry>>(
      `/companies/${companyId}/menu`
    );
  }

  async function createMenuEntry(
    companyId: string,
    input: CreateMenuEntryInput
  ) {
    return apiFetch<DataResponse<MenuEntry>>(`/companies/${companyId}/menu`, {
      method: "POST",
      body: input,
    });
  }

  async function deleteMenuEntry(companyId: string, entryId: string) {
    return apiFetch<DataResponse<MenuEntry>>(
      `/companies/${companyId}/menu/${entryId}`,
      { method: "DELETE" }
    );
  }

  return {
    listMenuEntries,
    createMenuEntry,
    deleteMenuEntry,
  };
}

function normalizeBackendUrl(value?: string) {
  const fallback = "http://localhost:3000";
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/\/$/, "");
}

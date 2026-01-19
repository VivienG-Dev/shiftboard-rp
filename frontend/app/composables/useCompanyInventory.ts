export type ItemCategory =
  | "DRINK"
  | "SOFT_DRINK"
  | "ALCOHOL_DRINK"
  | "BOTTLE"
  | "FOOD"
  | "OTHER";

export type Item = {
  id: string;
  companyId: string;
  name: string;
  category: ItemCategory;
  unit: string;
  basePrice: number | null;
  costPrice: number | null;
  lowStockThreshold: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type StockRow = {
  itemId: string;
  name: string;
  unit: string;
  category: ItemCategory;
  lowStockThreshold: number | null;
  baselineSnapshotId: string | null;
  baselineQuantity: number;
  soldSinceBaseline: number;
  restockedSinceBaseline: number;
  currentStock: number;
  isLowStock: boolean;
};

export type SnapshotListItem = {
  id: string;
  companyId: string;
  createdById: string;
  createdAt: string;
  note: string | null;
  _count: { lines: number };
};

export type SnapshotLine = {
  id: string;
  snapshotId: string;
  itemId: string;
  quantity: number;
  item: {
    id: string;
    name: string;
    unit: string;
    category: ItemCategory;
    costPrice: number | null;
  };
};

export type SnapshotDetail = {
  id: string;
  companyId: string;
  createdById: string;
  createdAt: string;
  note: string | null;
  lines: SnapshotLine[];
};

export type RestockListItem = {
  id: string;
  companyId: string;
  createdById: string;
  createdAt: string;
  note: string | null;
  _count: { lines: number };
};

export type RestockLine = {
  id: string;
  restockId: string;
  itemId: string;
  quantityAdded: number;
  item: { id: string; name: string; unit: string; category: ItemCategory };
};

export type RestockDetail = {
  id: string;
  companyId: string;
  createdById: string;
  createdAt: string;
  note: string | null;
  lines: RestockLine[];
};

type ListResponse<T> = { data: T[] };
type DataResponse<T> = { data: T };

type ListItemsQuery = {
  category?: ItemCategory;
  activeOnly?: boolean;
  includeArchived?: boolean;
  search?: string;
};

type CreateItemInput = {
  name: string;
  category: ItemCategory;
  unit: string;
  basePrice?: number;
  costPrice?: number;
  lowStockThreshold?: number;
};

type UpdateItemInput = Partial<CreateItemInput> & {
  basePrice?: number | null;
  costPrice?: number | null;
  lowStockThreshold?: number | null;
  isActive?: boolean;
};

type CreateSnapshotInput = {
  note?: string;
  lines: Array<{ itemId: string; quantity: number }>;
};

type CreateRestockInput = {
  note?: string;
  lines: Array<{ itemId: string; quantityAdded: number }>;
};

export function useCompanyInventory() {
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

  async function listItems(companyId: string, query: ListItemsQuery = {}) {
    return apiFetch<ListResponse<Item>>(`/companies/${companyId}/items`, {
      query: {
        ...query,
        activeOnly:
          query.activeOnly === undefined ? undefined : String(query.activeOnly),
        includeArchived:
          query.includeArchived === undefined
            ? undefined
            : String(query.includeArchived),
      },
    });
  }

  async function createItem(companyId: string, input: CreateItemInput) {
    return apiFetch<DataResponse<Item>>(`/companies/${companyId}/items`, {
      method: "POST",
      body: input,
    });
  }

  async function updateItem(
    companyId: string,
    itemId: string,
    input: UpdateItemInput
  ) {
    return apiFetch<DataResponse<Item>>(
      `/companies/${companyId}/items/${itemId}`,
      {
        method: "PATCH",
        body: input,
      }
    );
  }

  async function archiveItem(companyId: string, itemId: string) {
    return apiFetch<DataResponse<Item>>(
      `/companies/${companyId}/items/${itemId}/archive`,
      { method: "POST" }
    );
  }

  async function getStock(companyId: string) {
    return apiFetch<ListResponse<StockRow>>(`/companies/${companyId}/stock`);
  }

  async function listSnapshots(companyId: string) {
    return apiFetch<ListResponse<SnapshotListItem>>(
      `/companies/${companyId}/snapshots`
    );
  }

  async function getSnapshot(companyId: string, snapshotId: string) {
    return apiFetch<DataResponse<SnapshotDetail>>(
      `/companies/${companyId}/snapshots/${snapshotId}`
    );
  }

  async function createSnapshot(companyId: string, input: CreateSnapshotInput) {
    return apiFetch<DataResponse<SnapshotDetail>>(
      `/companies/${companyId}/snapshots`,
      { method: "POST", body: input }
    );
  }

  async function listRestocks(companyId: string) {
    return apiFetch<ListResponse<RestockListItem>>(
      `/companies/${companyId}/restocks`
    );
  }

  async function getRestock(companyId: string, restockId: string) {
    return apiFetch<DataResponse<RestockDetail>>(
      `/companies/${companyId}/restocks/${restockId}`
    );
  }

  async function createRestock(companyId: string, input: CreateRestockInput) {
    return apiFetch<DataResponse<RestockDetail>>(
      `/companies/${companyId}/restocks`,
      { method: "POST", body: input }
    );
  }

  return {
    listItems,
    createItem,
    updateItem,
    archiveItem,
    getStock,
    listSnapshots,
    getSnapshot,
    createSnapshot,
    listRestocks,
    getRestock,
    createRestock,
  };
}

function normalizeBackendUrl(value?: string) {
  const fallback = "http://localhost:3000";
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/\/$/, "");
}

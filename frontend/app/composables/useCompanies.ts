export type CompanyType = "BAR" | "CLUB" | "FAST_FOOD" | "OTHER";

export type CompanyLocation = {
  id: string;
  companyId: string;
  name: string;
};

export type Company = {
  id: string;
  name: string;
  slug: string | null;
  type: CompanyType;
  ownerId: string;
  locations?: CompanyLocation[];
};

type ListCompaniesResponse = { data: Company[] };

type CreateCompanyInput = {
  name: string;
  slug?: string;
  type?: CompanyType;
};

type CreateCompanyResponse = {
  company: Company;
  membership: unknown;
  ownerRole: unknown;
};

type GetCompanyResponse = { data: Company };
type ListCompanyLocationsResponse = { data: CompanyLocation[] };

type CreateCompanyLocationInput = {
  name: string;
};

type CreateCompanyLocationResponse = { data: CompanyLocation };

export function useCompanies() {
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

  async function listMyCompanies() {
    return apiFetch<ListCompaniesResponse>("/companies");
  }

  async function createCompany(input: CreateCompanyInput) {
    return apiFetch<CreateCompanyResponse>("/companies", {
      method: "POST",
      body: input,
    });
  }

  async function getCompany(companyId: string) {
    return apiFetch<GetCompanyResponse>(`/companies/${companyId}`);
  }

  async function listCompanyLocations(companyId: string) {
    return apiFetch<ListCompanyLocationsResponse>(`/companies/${companyId}/locations`);
  }

  async function createCompanyLocation(companyId: string, input: CreateCompanyLocationInput) {
    return apiFetch<CreateCompanyLocationResponse>(`/companies/${companyId}/locations`, {
      method: "POST",
      body: input,
    });
  }

  return {
    listMyCompanies,
    createCompany,
    getCompany,
    listCompanyLocations,
    createCompanyLocation,
  };
}

function normalizeBackendUrl(value?: string) {
  const fallback = "http://localhost:3000";
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/\/$/, "");
}

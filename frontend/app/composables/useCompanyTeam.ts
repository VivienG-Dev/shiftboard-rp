export type CompanyRole = {
  id: string;
  companyId: string;
  name: string;
  key: string;
  isSystem: boolean;
  archivedAt: string | null;
  permissions?: string[];
};

export type MemberRow = {
  membership: {
    id: string;
    companyId: string;
    userId: string;
    activeRoleId: string | null;
    createdAt: string;
  };
  user: { id: string; name: string; email: string; image: string | null };
  roles: Array<Pick<CompanyRole, "id" | "name" | "key" | "isSystem" | "archivedAt">>;
};

export type MyMembership = {
  membership: {
    id: string;
    companyId: string;
    userId: string;
    activeRoleId: string | null;
  };
  company: { id: string; name: string; ownerId: string; archivedAt: string | null };
  roles: Array<Pick<CompanyRole, "id" | "name" | "key" | "permissions">>;
};

export type Invite = {
  id: string;
  companyId: string;
  roleId: string;
  email: string;
  code: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
  createdById: string;
  acceptedById: string | null;
  acceptedAt: string | null;
  expiresAt: string;
  createdAt: string;
  type: "EMAIL_CODE";
};

type ListResponse<T> = { data: T[] };
type DataResponse<T> = { data: T };

type CreateInviteInput = {
  email: string;
  roleId: string;
  expiresInHours?: number;
};

type CreateRoleInput = {
  name: string;
  key?: string;
  permissions?: string[];
};

type UpdateRoleInput = {
  name?: string;
  permissions?: string[];
};

export function useCompanyTeam() {
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

  async function getMyMembership(companyId: string) {
    return apiFetch<DataResponse<MyMembership>>(`/companies/${companyId}/me`);
  }

  async function updateMyMembership(companyId: string, activeRoleId: string) {
    return apiFetch<DataResponse<unknown>>(`/companies/${companyId}/me`, {
      method: "PATCH",
      body: { activeRoleId },
    });
  }

  async function listMembers(companyId: string) {
    return apiFetch<ListResponse<MemberRow>>(`/companies/${companyId}/members`);
  }

  async function listRoles(companyId: string) {
    return apiFetch<ListResponse<CompanyRole>>(`/companies/${companyId}/roles`);
  }

  async function createRole(companyId: string, input: CreateRoleInput) {
    return apiFetch<DataResponse<CompanyRole>>(`/companies/${companyId}/roles`, {
      method: "POST",
      body: input,
    });
  }

  async function updateRole(companyId: string, roleId: string, input: UpdateRoleInput) {
    return apiFetch<DataResponse<CompanyRole>>(`/companies/${companyId}/roles/${roleId}`, {
      method: "PATCH",
      body: input,
    });
  }

  async function archiveRole(companyId: string, roleId: string) {
    return apiFetch<DataResponse<CompanyRole>>(`/companies/${companyId}/roles/${roleId}/archive`, {
      method: "POST",
    });
  }

  async function updateMember(companyId: string, memberId: string, activeRoleId: string) {
    return apiFetch<DataResponse<MemberRow>>(`/companies/${companyId}/members/${memberId}`, {
      method: "PATCH",
      body: { activeRoleId },
    });
  }

  async function addMemberRole(companyId: string, memberId: string, roleId: string) {
    return apiFetch<DataResponse<MemberRow>>(`/companies/${companyId}/members/${memberId}/roles`, {
      method: "POST",
      body: { roleId },
    });
  }

  async function removeMemberRole(companyId: string, memberId: string, roleId: string) {
    return apiFetch<DataResponse<MemberRow>>(
      `/companies/${companyId}/members/${memberId}/roles/${roleId}`,
      { method: "DELETE" }
    );
  }

  async function archiveMember(companyId: string, memberId: string) {
    return apiFetch<DataResponse<MemberRow>>(`/companies/${companyId}/members/${memberId}/archive`, {
      method: "POST",
    });
  }

  async function listInvites(companyId: string) {
    return apiFetch<ListResponse<Invite>>(`/companies/${companyId}/invites`);
  }

  async function createInvite(companyId: string, input: CreateInviteInput) {
    return apiFetch<DataResponse<Invite>>(`/companies/${companyId}/invites`, {
      method: "POST",
      body: input,
    });
  }

  async function acceptInvite(code: string) {
    return apiFetch<DataResponse<{ membershipId: string; companyId: string; roleId: string }>>(
      `/invites/${code}/accept`,
      { method: "POST" }
    );
  }

  return {
    getMyMembership,
    updateMyMembership,
    listMembers,
    listRoles,
    createRole,
    updateRole,
    archiveRole,
    updateMember,
    addMemberRole,
    removeMemberRole,
    archiveMember,
    listInvites,
    createInvite,
    acceptInvite,
  };
}

function normalizeBackendUrl(value?: string) {
  const fallback = "http://localhost:3000";
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/\/$/, "");
}

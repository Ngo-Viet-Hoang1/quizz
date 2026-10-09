import { apiClient, useApiClient } from '@/shared/lib/api-client';

export interface PublicOrganization {
  _id: string;
  name: string;
  slug?: string | null;
  logoUrl?: string | null;
  createdAt: string;
}

export interface JoinOrganizationResponse {
  success: boolean;
  organization: PublicOrganization;
}

export interface PublicOrganizationPaginatedResponse {
  data: PublicOrganization[];
  total: number;
  hasMore: boolean;
}

export function useOrganizationsApi() {
  const client = useApiClient();

  return {
    getPublicOrganizations: async (
      search?: string,
      page = 1,
      limit = 3,
    ): Promise<PublicOrganizationPaginatedResponse> => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('page', String(page));
      params.append('limit', String(limit));
      const res = await client.get<unknown>(`/organizations/public?${params.toString()}`);
      if (Array.isArray(res)) {
        return { data: res, hasMore: false, total: res.length };
      }
      const p = res as { data?: PublicOrganization[]; hasMore?: boolean; total?: number };
      return {
        data: p?.data || [],
        hasMore: Boolean(p?.hasMore),
        total: p?.total || 0,
      };
    },
    joinAsStudent: async (orgId: string): Promise<JoinOrganizationResponse> => {
      return client.post<JoinOrganizationResponse>(`/organizations/${orgId}/join`);
    },
  };
}

export const organizationsApi = {
  getPublicOrganizations: async (
    search?: string,
    page = 1,
    limit = 3,
  ): Promise<PublicOrganizationPaginatedResponse> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('page', String(page));
    params.append('limit', String(limit));
    const res = await apiClient.get<unknown>(`/organizations/public?${params.toString()}`);
    if (Array.isArray(res)) {
      return { data: res, hasMore: false, total: res.length };
    }
    const p = res as { data?: PublicOrganization[]; hasMore?: boolean; total?: number };
    return {
      data: p?.data || [],
      hasMore: Boolean(p?.hasMore),
      total: p?.total || 0,
    };
  },
  joinAsStudent: async (orgId: string): Promise<JoinOrganizationResponse> => {
    return apiClient.post<JoinOrganizationResponse>(`/organizations/${orgId}/join`);
  },
};

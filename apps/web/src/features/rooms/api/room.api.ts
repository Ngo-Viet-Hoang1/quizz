import { apiClient, useApiClient } from '@/shared/lib/api-client';
import { HostRoomsStatsResponse, RoomCreatedResponse, RoomResultItem } from '@repo/shared-types';

export interface RoomQueryParams {
  page?: number;
  limit?: number;
}

export const roomKeys = {
  all: ['rooms'] as const,
  hostHistory: (orgId: string | null | undefined, params?: RoomQueryParams) =>
    [...roomKeys.all, 'hostHistory', orgId, params ?? {}] as const,
  hostStats: (orgId: string | null | undefined) => [...roomKeys.all, 'hostStats', orgId] as const,
};

export const createRoomApi = (client = apiClient) => ({
  getHostStats: () => client.get<HostRoomsStatsResponse>('/rooms/stats/host'),
  getHostHistory: (params?: RoomQueryParams) =>
    client.getPaginated<RoomResultItem[]>('/rooms/history/host', { params }),
  createRoom: (quizId: string, options?: { quizVersion?: number; timeLimitSec?: number }) =>
    client.post<RoomCreatedResponse>('/rooms', {
      quizId,
      quizVersion: options?.quizVersion,
      timeLimitSec: options?.timeLimitSec,
    }),
  closeRoom: (pin: string) =>
    client.post<{ success: boolean; message?: string }>(`/rooms/${pin}/close`),
});

export const useRoomApi = () => {
  const client = useApiClient();
  return createRoomApi(client);
};

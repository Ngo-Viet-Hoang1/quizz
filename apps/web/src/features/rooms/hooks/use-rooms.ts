import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { roomKeys, RoomQueryParams, useRoomApi } from '../api/room.api';

export function useHostRooms(params?: RoomQueryParams) {
  const { isLoaded, orgId } = useAuth();
  const api = useRoomApi();

  return useQuery({
    queryKey: roomKeys.hostHistory(orgId, params),
    queryFn: () => api.getHostHistory(params),
    enabled: isLoaded && Boolean(orgId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useHostRoomStats() {
  const { isLoaded, orgId } = useAuth();
  const api = useRoomApi();

  return useQuery({
    queryKey: roomKeys.hostStats(orgId),
    queryFn: () => api.getHostStats(),
    enabled: isLoaded && Boolean(orgId),
    staleTime: 10000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useCloseRoom() {
  const queryClient = useQueryClient();
  const api = useRoomApi();

  return useMutation({
    mutationFn: (pin: string) => api.closeRoom(pin),
    onSuccess: () => {
      toast.success('Live room closed successfully');
      queryClient.invalidateQueries({ queryKey: roomKeys.all });
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message || 'Failed to close room');
    },
  });
}

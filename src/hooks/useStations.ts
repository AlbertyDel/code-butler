import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { api, type ApiError } from '@/lib/api';
import type { Station } from '@/types';
import { DeviceResponse, mapDeviceToStation } from '@/types/api';

const STATIONS_KEY = ['stations'];

export function useStations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // GET all stations - using React Query
  const stationsQuery = useQuery({
    queryKey: STATIONS_KEY,
    queryFn: async (): Promise<Station[]> => {
      const response = await api.get<{ data: DeviceResponse[] } | DeviceResponse[]>('/devices');
      const responseData = response.data as { data?: DeviceResponse[] } | DeviceResponse[];
      const rawData = 'data' in responseData ? responseData.data : responseData;
      const devices: DeviceResponse[] = Array.isArray(rawData) ? rawData : [];
      return devices.map(mapDeviceToStation);
    },
    staleTime: 30000,
  });

  const useStation = (id: string) => useQuery({
    queryKey: [...STATIONS_KEY, id],
    queryFn: async (): Promise<Station | null> => {
      const response = await api.get<{ data: DeviceResponse } | DeviceResponse>(`/devices/${id}`);
      const responseData = response.data as { data?: DeviceResponse } | DeviceResponse;
      const rawData = 'data' in responseData ? responseData.data : responseData;
      return mapDeviceToStation(rawData as DeviceResponse);
    },
    enabled: !!id,
  });

  const getErrorMessage = (error: ApiError, fallback: string): string => {
    return error?.response?.data?.error?.message 
      || error?.response?.data?.message 
      || error?.message 
      || fallback;
  };

  const addStationMutation = useMutation({
    mutationFn: async (stationData: Partial<Station>) => {
      const response = await api.post('/devices', {
        id: stationData.id,
        name: stationData.name,
        address: stationData.address,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATIONS_KEY });
      toast({
        title: "Станция добавлена",
        description: "Новая станция успешно добавлена",
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Ошибка",
        description: getErrorMessage(error, 'Не удалось добавить станцию'),
        variant: 'destructive',
      });
    },
  });

  const updateStationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Station> }) => {
      const response = await api.patch(`/devices/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATIONS_KEY });
      toast({
        title: "Станция обновлена",
        description: "Изменения сохранены",
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Ошибка",
        description: getErrorMessage(error, 'Не удалось обновить станцию'),
        variant: 'destructive',
      });
    },
  });

  const deleteStationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/devices/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATIONS_KEY });
      toast({
        title: "Станция удалена",
        description: "Станция была удалена",
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Ошибка",
        description: getErrorMessage(error, 'Не удалось удалить станцию'),
        variant: 'destructive',
      });
    },
  });

  const startChargingMutation = useMutation({
    mutationFn: async (stationId: string) => {
      const response = await api.post(`/commands/devices/${stationId}/start-charge`, {
        port: 0,
        maxTime: 0,
        maxEnergy: 0,
      });
      return response.data;
    },
    onSuccess: () => {
      // Immediately invalidate and refetch to update station status
      queryClient.invalidateQueries({ queryKey: STATIONS_KEY });
      queryClient.refetchQueries({ queryKey: STATIONS_KEY });
      toast({
        title: "Зарядка запущена",
        description: "Сессия зарядки успешно начата",
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Ошибка",
        description: getErrorMessage(error, 'Не удалось запустить зарядку'),
        variant: 'destructive',
      });
    },
  });

  const stopChargingMutation = useMutation({
    mutationFn: async (stationId: string) => {
      const response = await api.post(`/commands/devices/${stationId}/stop-charge`, {
        port: 0,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATIONS_KEY });
      toast({
        title: "Зарядка остановлена",
        description: "Сессия зарядки завершена",
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: "Ошибка",
        description: getErrorMessage(error, 'Не удалось остановить зарядку'),
        variant: 'destructive',
      });
    },
  });

  return {
    stations: stationsQuery.data || [],
    isLoading: stationsQuery.isLoading,
    error: stationsQuery.error,
    
    refetch: stationsQuery.refetch,
    
    addStation: addStationMutation.mutate,
    updateStation: ({ id, data }: { id: string; data: Partial<Station> }) => 
      updateStationMutation.mutate({ id, data }),
    deleteStation: deleteStationMutation.mutate,
    startCharging: startChargingMutation.mutate,
    stopCharging: stopChargingMutation.mutate,
    
    isAdding: addStationMutation.isPending,
    isUpdating: updateStationMutation.isPending,
    isDeleting: deleteStationMutation.isPending,
    isStarting: startChargingMutation.isPending,
    isStopping: stopChargingMutation.isPending,
  };
}


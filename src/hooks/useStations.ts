import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { mockStations } from '@/lib/mock-data';
import type { Station, ChargerStatus } from '@/types';

interface UseStationsReturn {
  stations: Station[];
  isLoading: boolean;
  error: string | null;
  addStation: (stationData: Partial<Station>) => Promise<void>;
  updateStation: (stationData: Partial<Station>) => Promise<void>;
  deleteStation: (stationId: string) => Promise<void>;
  startCharging: (stationId: string) => Promise<void>;
  stopCharging: (stationId: string) => Promise<void>;
  refetch: () => void;
}

// Stations API
const stationsApi = {
  getAll: async () => {
    const response = await api.get('/devices');
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await api.get(`/devices/${id}`);
    return response.data;
  },
  create: async (data: Partial<Station>) => {
    const response = await api.post('/devices', data);
    return response.data;
  },
  update: async (id: string, data: Partial<Station>) => {
    const response = await api.patch(`/devices/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/devices/${id}`);
    return response.data;
  },
  startCharge: async (id: string) => {
    const response = await api.post(`/commands/devices/${id}/start-charge`);
    return response.data;
  },
  stopCharge: async (id: string) => {
    const response = await api.post(`/commands/devices/${id}/stop-charge`);
    return response.data;
  },
};

export function useStations(): UseStationsReturn {
  const { toast } = useToast();
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMock, setUseMock] = useState(false);

  const fetchStations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await stationsApi.getAll();
      const data = response.data || response;
      setStations(data);
      setUseMock(false);
    } catch (err) {
      console.log('[useStations] API unavailable, using mock data');
      setStations(mockStations);
      setUseMock(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const addStation = useCallback(async (stationData: Partial<Station>) => {
    if (useMock) {
      const newStation: Station = {
        id: stationData.id || `st-${Date.now()}`,
        name: stationData.name || 'Новая станция',
        address: stationData.address || '',
        latitude: stationData.latitude || 55.751244,
        longitude: stationData.longitude || 37.618423,
        status: 'available',
        connectors: stationData.connectors || [],
        ownerId: '1',
        createdAt: new Date().toISOString(),
      };
      setStations(prev => [...prev, newStation]);
      toast({ title: "Станция добавлена", description: `${newStation.name} успешно добавлена` });
      return;
    }
    try {
      await stationsApi.create(stationData);
      await fetchStations();
      toast({ title: "Станция добавлена", description: `${stationData.name} успешно добавлена` });
    } catch (err) {
      toast({ title: "Ошибка", description: err instanceof Error ? err.message : 'Не удалось добавить станцию', variant: 'destructive' });
    }
  }, [useMock, fetchStations, toast]);

  const updateStation = useCallback(async (stationData: Partial<Station>) => {
    if (!stationData.id) return;
    if (useMock) {
      setStations(prev => prev.map(s => s.id === stationData.id ? { ...s, ...stationData } as Station : s));
      toast({ title: "Станция обновлена", description: "Изменения сохранены" });
      return;
    }
    try {
      await stationsApi.update(stationData.id, stationData);
      await fetchStations();
      toast({ title: "Станция обновлена", description: "Изменения сохранены" });
    } catch (err) {
      toast({ title: "Ошибка", description: err instanceof Error ? err.message : 'Не удалось обновить станцию', variant: 'destructive' });
    }
  }, [useMock, fetchStations, toast]);

  const deleteStation = useCallback(async (stationId: string) => {
    if (useMock) {
      setStations(prev => prev.filter(s => s.id !== stationId));
      toast({ title: "Станция удалена", description: "Станция была удалена" });
      return;
    }
    try {
      await stationsApi.delete(stationId);
      await fetchStations();
      toast({ title: "Станция удалена", description: "Станция была удалена" });
    } catch (err) {
      toast({ title: "Ошибка", description: err instanceof Error ? err.message : 'Не удалось удалить станцию', variant: 'destructive' });
    }
  }, [useMock, fetchStations, toast]);

  const startCharging = useCallback(async (stationId: string) => {
    try {
      await stationsApi.startCharge(stationId);
      await fetchStations();
      toast({
        title: "Зарядка запущена",
        description: "Сессия зарядки успешно начата",
      });
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : 'Не удалось запустить зарядку',
        variant: 'destructive',
      });
    }
  }, [fetchStations, toast]);

  const stopCharging = useCallback(async (stationId: string) => {
    try {
      await stationsApi.stopCharge(stationId);
      await fetchStations();
      toast({
        title: "Зарядка остановлена",
        description: "Сессия зарядки завершена",
      });
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : 'Не удалось остановить зарядку',
        variant: 'destructive',
      });
    }
  }, [fetchStations, toast]);

  return {
    stations,
    isLoading,
    error,
    addStation,
    updateStation,
    deleteStation,
    startCharging,
    stopCharging,
    refetch: fetchStations,
  };
}

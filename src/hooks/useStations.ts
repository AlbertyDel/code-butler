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

const DEFAULT_ELECTRICAL: Station['electrical'] = {
  voltagePhase1: 228,
  voltagePhase2: 230,
  voltagePhase3: 229,
  phases: 3,
  maxCurrentA: 16,
  relayState: 'on',
};

const DEFAULT_TEMPERATURE: Station['temperature'] = {
  inputContacts: 32,
  port0: 28,
  port1: 27,
  internal: 35,
};

const DEFAULT_STATS: Station['stats'] = {
  energyTodayKwh: 0,
  sessionsToday: 0,
  totalSessions: 0,
  totalEnergyKwh: 0,
  totalHours: 0,
};

const CHARGER_STATUSES: ChargerStatus[] = ['available', 'charging', 'offline', 'maintenance'];
const CONNECTOR_TYPES = ['Type2', 'CCS', 'CHAdeMO', 'GB/T'] as const;

type JsonRecord = Record<string, unknown>;

const toNumber = (value: unknown, fallback: number): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeStatus = (value: unknown): ChargerStatus => {
  return typeof value === 'string' && CHARGER_STATUSES.includes(value as ChargerStatus)
    ? (value as ChargerStatus)
    : 'offline';
};

const extractStationsArray = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as JsonRecord;
  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(record.devices)) return record.devices;
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.results)) return record.results;

  if (record.data && typeof record.data === 'object') {
    const nestedData = record.data as JsonRecord;
    if (Array.isArray(nestedData.devices)) return nestedData.devices;
    if (Array.isArray(nestedData.items)) return nestedData.items;
    if (Array.isArray(nestedData.results)) return nestedData.results;
  }

  return [];
};

const normalizeConnectors = (rawConnectors: unknown, stationId: string): Station['connectors'] => {
  if (!Array.isArray(rawConnectors)) return [];

  return rawConnectors.map((rawConnector, index) => {
    const connector = (rawConnector ?? {}) as JsonRecord;
    const rawType = typeof connector.type === 'string' ? connector.type : 'Type2';

    return {
      id: typeof connector.id === 'string' && connector.id ? connector.id : `${stationId}-c-${index + 1}`,
      stationId,
      type: CONNECTOR_TYPES.includes(rawType as (typeof CONNECTOR_TYPES)[number])
        ? (rawType as Station['connectors'][number]['type'])
        : 'Type2',
      powerKw: toNumber(connector.powerKw, 22),
      status: normalizeStatus(connector.status),
    };
  });
};

const normalizeStation = (rawStation: unknown, index: number): Station => {
  const station = (rawStation ?? {}) as JsonRecord;
  const stationId = typeof station.id === 'string' && station.id
    ? station.id
    : `st-${Date.now()}-${index}`;

  const electrical = (station.electrical && typeof station.electrical === 'object'
    ? station.electrical
    : {}) as JsonRecord;
  const temperature = (station.temperature && typeof station.temperature === 'object'
    ? station.temperature
    : {}) as JsonRecord;
  const stats = (station.stats && typeof station.stats === 'object'
    ? station.stats
    : {}) as JsonRecord;

  return {
    id: stationId,
    name: typeof station.name === 'string' && station.name ? station.name : `Станция ${index + 1}`,
    address: typeof station.address === 'string' ? station.address : '',
    latitude: toNumber(station.latitude, 55.751244),
    longitude: toNumber(station.longitude, 37.618423),
    status: normalizeStatus(station.status),
    connectors: normalizeConnectors(station.connectors, stationId),
    ownerId: typeof station.ownerId === 'string' ? station.ownerId : (typeof station.userId === 'string' ? station.userId : '1'),
    organizationId: typeof station.organizationId === 'string' ? station.organizationId : undefined,
    createdAt: typeof station.createdAt === 'string' ? station.createdAt : new Date().toISOString(),
    electrical: {
      voltagePhase1: toNumber(electrical.voltagePhase1, DEFAULT_ELECTRICAL.voltagePhase1),
      voltagePhase2: toNumber(electrical.voltagePhase2, DEFAULT_ELECTRICAL.voltagePhase2),
      voltagePhase3: toNumber(electrical.voltagePhase3, DEFAULT_ELECTRICAL.voltagePhase3),
      phases: toNumber(electrical.phases, DEFAULT_ELECTRICAL.phases),
      maxCurrentA: toNumber(electrical.maxCurrentA, DEFAULT_ELECTRICAL.maxCurrentA),
      relayState: electrical.relayState === 'off' ? 'off' : 'on',
    },
    temperature: {
      inputContacts: toNumber(temperature.inputContacts, DEFAULT_TEMPERATURE.inputContacts),
      port0: toNumber(temperature.port0, DEFAULT_TEMPERATURE.port0),
      port1: toNumber(temperature.port1, DEFAULT_TEMPERATURE.port1),
      internal: toNumber(temperature.internal, DEFAULT_TEMPERATURE.internal),
    },
    stats: {
      energyTodayKwh: toNumber(stats.energyTodayKwh, DEFAULT_STATS.energyTodayKwh),
      sessionsToday: toNumber(stats.sessionsToday, DEFAULT_STATS.sessionsToday),
      totalSessions: toNumber(stats.totalSessions, DEFAULT_STATS.totalSessions),
      totalEnergyKwh: toNumber(stats.totalEnergyKwh, DEFAULT_STATS.totalEnergyKwh),
      totalHours: toNumber(stats.totalHours, DEFAULT_STATS.totalHours),
    },
  };
};

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
      const normalizedStations = extractStationsArray(response).map((station, index) =>
        normalizeStation(station, index)
      );

      setStations(normalizedStations);
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
      const normalizedStation = normalizeStation({
        id: stationData.id || `st-${Date.now()}`,
        name: stationData.name || 'Новая станция',
        address: stationData.address || '',
        latitude: stationData.latitude,
        longitude: stationData.longitude,
        status: stationData.status || 'available',
        connectors: stationData.connectors,
        ownerId: stationData.ownerId || '1',
        createdAt: stationData.createdAt || new Date().toISOString(),
        electrical: stationData.electrical,
        temperature: stationData.temperature,
        stats: stationData.stats,
      }, 0);

      setStations(prev => [...prev, normalizedStation]);
      toast({ title: 'Станция добавлена', description: `${normalizedStation.name} успешно добавлена` });
      return;
    }
    try {
      await stationsApi.create(stationData);
      await fetchStations();
      toast({ title: 'Станция добавлена', description: `${stationData.name} успешно добавлена` });
    } catch (err) {
      toast({ title: 'Ошибка', description: err instanceof Error ? err.message : 'Не удалось добавить станцию', variant: 'destructive' });
    }
  }, [useMock, fetchStations, toast]);

  const updateStation = useCallback(async (stationData: Partial<Station>) => {
    if (!stationData.id) return;

    if (useMock) {
      setStations(prev => prev.map((station, index) => {
        if (station.id !== stationData.id) return station;
        return normalizeStation({ ...station, ...stationData }, index);
      }));
      toast({ title: 'Станция обновлена', description: 'Изменения сохранены' });
      return;
    }

    try {
      await stationsApi.update(stationData.id, stationData);
      await fetchStations();
      toast({ title: 'Станция обновлена', description: 'Изменения сохранены' });
    } catch (err) {
      toast({ title: 'Ошибка', description: err instanceof Error ? err.message : 'Не удалось обновить станцию', variant: 'destructive' });
    }
  }, [useMock, fetchStations, toast]);

  const deleteStation = useCallback(async (stationId: string) => {
    if (useMock) {
      setStations(prev => prev.filter(s => s.id !== stationId));
      toast({ title: 'Станция удалена', description: 'Станция была удалена' });
      return;
    }
    try {
      await stationsApi.delete(stationId);
      await fetchStations();
      toast({ title: 'Станция удалена', description: 'Станция была удалена' });
    } catch (err) {
      toast({ title: 'Ошибка', description: err instanceof Error ? err.message : 'Не удалось удалить станцию', variant: 'destructive' });
    }
  }, [useMock, fetchStations, toast]);

  const startCharging = useCallback(async (stationId: string) => {
    if (useMock) {
      setStations(prev => prev.map(s => s.id === stationId ? { ...s, status: 'charging' as const } : s));
      toast({ title: 'Зарядка запущена', description: 'Сессия зарядки успешно начата' });
      return;
    }
    try {
      await stationsApi.startCharge(stationId);
      await fetchStations();
      toast({ title: 'Зарядка запущена', description: 'Сессия зарядки успешно начата' });
    } catch (err) {
      toast({ title: 'Ошибка', description: err instanceof Error ? err.message : 'Не удалось запустить зарядку', variant: 'destructive' });
    }
  }, [useMock, fetchStations, toast]);

  const stopCharging = useCallback(async (stationId: string) => {
    if (useMock) {
      setStations(prev => prev.map(s => s.id === stationId ? { ...s, status: 'available' as const } : s));
      toast({ title: 'Зарядка остановлена', description: 'Сессия зарядки завершена' });
      return;
    }
    try {
      await stationsApi.stopCharge(stationId);
      await fetchStations();
      toast({ title: 'Зарядка остановлена', description: 'Сессия зарядки завершена' });
    } catch (err) {
      toast({ title: 'Ошибка', description: err instanceof Error ? err.message : 'Не удалось остановить зарядку', variant: 'destructive' });
    }
  }, [useMock, fetchStations, toast]);

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


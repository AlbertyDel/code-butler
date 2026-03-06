import { useState, useMemo, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { ChargingSession, Station } from '@/types';

interface SessionGroup {
  label: string;
  sessions: ChargingSession[];
}

interface UseSessionsReturn {
  sessions: ChargingSession[];
  activeSessions: ChargingSession[];
  completedSessions: ChargingSession[];
  groupedSessions: SessionGroup[];
  isLoading: boolean;
  error: string | null;
  stopSession: (sessionId: string) => void;
  getStation: (stationId: string) => Station | undefined;
  formatDuration: (startTime: string, endTime?: string) => string;
  refetch: () => void;
}

// Sessions API
const sessionsApi = {
  getAll: async (deviceId?: string) => {
    const url = deviceId ? `/devices/${deviceId}/sessions` : '/devices';
    const response = await api.get(url);
    return response.data;
  },
};

export function useSessions(): UseSessionsReturn {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch devices (as stations)
      const devicesResponse = await api.get('/devices');
      const devices = devicesResponse.data.data || devicesResponse.data || [];
      
      // Map devices to stations format
      const mappedStations: Station[] = devices.map((d: any) => ({
        id: d.id,
        name: d.name || `Станция ${d.id}`,
        address: d.address || '',
        latitude: d.latitude,
        longitude: d.longitude,
        status: d.status || 'offline',
        connectors: d.connectors || [],
        ownerId: d.ownerId || d.userId,
        createdAt: d.createdAt,
      }));
      setStations(mappedStations);

      // Fetch sessions for all devices
      const allSessions: ChargingSession[] = [];
      for (const device of devices) {
        try {
          const sessionsResponse = await api.get(`/devices/${device.id}/sessions`);
          const deviceSessions = sessionsResponse.data.data || sessionsResponse.data || [];
          allSessions.push(...deviceSessions.map((s: any) => ({
            ...s,
            stationId: device.id,
          })));
        } catch (e) {
          // Device might not have sessions
        }
      }
      
      setSessions(allSessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки сессий');
      console.error('Error fetching sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeSessions = useMemo(
    () => sessions.filter(s => s.status === 'IN_PROGRESS' || s.status === 'active'),
    [sessions]
  );

  const completedSessions = useMemo(
    () => sessions.filter(s => s.status !== 'IN_PROGRESS' && s.status !== 'active'),
    [sessions]
  );

  const groupedSessions = useMemo<SessionGroup[]>(() => {
    const groups: SessionGroup[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sessionsByDate = new Map<string, ChargingSession[]>();

    completedSessions.forEach(session => {
      const date = new Date(session.startTime);
      date.setHours(0, 0, 0, 0);
      const key = date.toISOString();

      if (!sessionsByDate.has(key)) {
        sessionsByDate.set(key, []);
      }
      sessionsByDate.get(key)!.push(session);
    });

    const sortedDates = Array.from(sessionsByDate.keys()).sort((a, b) =>
      new Date(b).getTime() - new Date(a).getTime()
    );

    sortedDates.forEach(dateKey => {
      const date = new Date(dateKey);
      let label: string;

      if (date.getTime() === today.getTime()) {
        label = 'Сегодня';
      } else if (date.getTime() === yesterday.getTime()) {
        label = 'Вчера';
      } else {
        label = date.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }

      groups.push({
        label,
        sessions: sessionsByDate.get(dateKey)!.sort((a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        ),
      });
    });

    return groups;
  }, [completedSessions]);

  const stopSession = useCallback(async (sessionId: string) => {
    try {
      await api.post(`/commands/devices/${sessionId}/stop-charge`);
      setSessions(prev => prev.map(session =>
        session.id === sessionId
          ? { ...session, status: 'COMPLETED' as const, endTime: new Date().toISOString() }
          : session
      ));
      toast({
        title: "Сессия остановлена",
        description: "Зарядка успешно завершена",
      });
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : 'Не удалось остановить сессию',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const getStation = useCallback((stationId: string): Station | undefined => {
    return stations.find(s => s.id === stationId);
  }, [stations]);

  const formatDuration = useCallback((startTime: string, endTime?: string): string => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours} ч ${mins} м` : `${mins} м`;
  }, []);

  return {
    sessions,
    activeSessions,
    completedSessions,
    groupedSessions,
    isLoading,
    error,
    stopSession,
    getStation,
    formatDuration,
    refetch: fetchData,
  };
}

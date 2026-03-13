import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { ChargingSession, Station } from '@/types';
import { DeviceResponse, SessionResponse, mapDeviceToStation, mapSessionToChargingSession } from '@/types/api';

const SESSIONS_KEY = ['sessions'];
const STATIONS_KEY = ['stations'];

export function useSessions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sessionsQuery = useQuery({
    queryKey: SESSIONS_KEY,
    queryFn: async (): Promise<{ sessions: ChargingSession[]; stations: Station[] }> => {
      const devicesResponse = await api.get<{ data: DeviceResponse[] } | DeviceResponse[]>('/devices');
      const responseData = devicesResponse.data as { data?: DeviceResponse[] } | DeviceResponse[];
      const rawDevices = 'data' in responseData ? responseData.data : responseData;
      const devices: DeviceResponse[] = Array.isArray(rawDevices) ? rawDevices : [];

      // Map devices to stations
      const stations = devices.map(mapDeviceToStation);

      const sessionsPromises = devices.map(async (device) => {
        try {
          const sessionsResponse = await api.get<{ data: { sessions: SessionResponse[]; total: number } } | { sessions: SessionResponse[] }>(
            `/devices/${device.id}/sessions`
          );
          const sessionsData = sessionsResponse.data as { data?: { sessions: SessionResponse[] } } | { sessions?: SessionResponse[] };
          let rawSessions: SessionResponse[] = [];
          
          if ('data' in sessionsData && sessionsData.data && 'sessions' in sessionsData.data) {
            rawSessions = sessionsData.data.sessions;
          } else if ('sessions' in sessionsData) {
            rawSessions = sessionsData.sessions || [];
          }
          
          return rawSessions.map(s => mapSessionToChargingSession(s, device.id));
        } catch {
          // Device might not have sessions
          return [];
        }
      });

      const sessionsArrays = await Promise.all(sessionsPromises);
      const allSessions = sessionsArrays.flat();

      return { sessions: allSessions, stations };
    },
    staleTime: 15000, // 15 seconds
  });

  const stopSessionMutation = useMutation({
    mutationFn: async ({ sessionId, deviceId }: { sessionId: string; deviceId: string }) => {
      const response = await api.post(`/commands/devices/${deviceId}/stop-charge`, {
        portNumber: 0,
        sessionId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
      toast({
        title: "Сессия остановлена",
        description: "Зарядка успешно завершена",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message || 'Не удалось остановить сессию',
        variant: 'destructive',
      });
    },
  });

  const sessions = sessionsQuery.data?.sessions || [];
  const stations = sessionsQuery.data?.stations || [];

  const activeSessions = sessions.filter(
    s => s.status === 'active'
  );

  const completedSessions = sessions.filter(
    s => s.status !== 'active'
  );

  const groupedSessions = useMemo(() => {
    const groups: { label: string; sessions: ChargingSession[] }[] = [];
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

  const getStation = (stationId: string): Station | undefined => {
    return stations.find(s => s.id === stationId);
  };

  const formatDuration = (startTime: string, endTime?: string): string => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours} ч ${mins} м` : `${mins} м`;
  };

  return {
    sessions,
    stations,
    activeSessions,
    completedSessions,
    groupedSessions,
    isLoading: sessionsQuery.isLoading,
    error: sessionsQuery.error,
    stopSession: ({ sessionId, deviceId }: { sessionId: string; deviceId: string }) =>
      stopSessionMutation.mutate({ sessionId, deviceId }),
    isStopping: stopSessionMutation.isPending,
    getStation,
    formatDuration,
    refetch: sessionsQuery.refetch,
  };
}

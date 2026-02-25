import { useState, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { mockStations } from '@/lib/mock-data';
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
  stopSession: (sessionId: string) => void;
  getStation: (stationId: string) => Station | undefined;
  formatDuration: (startTime: string, endTime?: string) => string;
}

// Генерация 100 сессий для демонстрации
function generateMockSessions(): ChargingSession[] {
  const sessions: ChargingSession[] = [];
  const stationIds = ['st-1', 'st-2', 'st-3', 'st-4'];
  const now = new Date();

  // 2 активные сессии
  sessions.push({
    id: 'ses-active-1',
    stationId: 'st-1',
    connectorId: 'c-1',
    userId: '1',
    startTime: new Date(now.getTime() - 4 * 60 * 60 * 1000 - 34 * 60 * 1000).toISOString(),
    energyKwh: 42.5,
    cost: 595,
    status: 'active',
  });

  sessions.push({
    id: 'ses-active-2',
    stationId: 'st-4',
    connectorId: 'c-7',
    userId: '1',
    startTime: new Date(now.getTime() - 1 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString(),
    energyKwh: 28.3,
    cost: 396,
    status: 'active',
  });

  // 100 завершённых сессий
  for (let i = 0; i < 100; i++) {
    const daysAgo = Math.floor(i / 3);
    const hoursOffset = (i % 3) * 6 + Math.random() * 4;

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysAgo);
    startDate.setHours(8 + hoursOffset, Math.floor(Math.random() * 60), 0);

    const durationMinutes = 30 + Math.floor(Math.random() * 300);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    const energyKwh = Math.round((10 + Math.random() * 50) * 10) / 10;

    sessions.push({
      id: `ses-${i + 3}`,
      stationId: stationIds[Math.floor(Math.random() * stationIds.length)],
      connectorId: `c-${Math.floor(Math.random() * 7) + 1}`,
      userId: '1',
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      energyKwh,
      cost: Math.round(energyKwh * 14),
      status: 'completed',
    });
  }

  return sessions;
}

// Extended stations for demonstration
const extendedStations: Station[] = [
  ...mockStations,
  {
    id: 'st-long',
    name: 'Супер-мега зарядная станция у торгового центра "Авиапарк" около метро Динамо',
    address: 'Ходынский бульвар, дом 4, строение 1, ТРЦ Авиапарк, подземный паркинг уровень -2, секция B',
    latitude: 55.789,
    longitude: 37.531,
    status: 'available',
    connectors: [{ id: 'c-long', stationId: 'st-long', type: 'CCS', powerKw: 150, status: 'available' }],
    ownerId: '1',
    createdAt: '2024-01-01T00:00:00Z',
    electrical: { voltagePhase1: 230, voltagePhase2: 229, voltagePhase3: 231, phases: 3, maxCurrentA: 16, relayState: 'on' },
    temperature: { inputContacts: 30, port0: 26, port1: 25, internal: 33 },
    stats: { energyTodayKwh: 20, sessionsToday: 1, totalSessions: 500, totalEnergyKwh: 5000, totalHours: 4500 },
  }
];

export function useSessions(): UseSessionsReturn {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ChargingSession[]>(() => generateMockSessions());

  const activeSessions = useMemo(
    () => sessions.filter(s => s.status === 'active'),
    [sessions]
  );

  const completedSessions = useMemo(
    () => sessions.filter(s => s.status !== 'active'),
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

  const stopSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.map(session =>
      session.id === sessionId
        ? { ...session, status: 'completed' as const, endTime: new Date().toISOString() }
        : session
    ));
    toast({
      title: "Сессия остановлена",
      description: "Зарядка успешно завершена",
    });
  }, [toast]);

  const getStation = useCallback((stationId: string): Station | undefined => {
    return extendedStations.find(s => s.id === stationId) || mockStations.find(s => s.id === stationId);
  }, []);

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
    stopSession,
    getStation,
    formatDuration,
  };
}

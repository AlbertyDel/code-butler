import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockStations } from '@/lib/mock-data';
import { ActiveSessionCard } from '@/components/sessions/ActiveSessionCard';
import { Clock, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ChargingSession } from '@/types';

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
    startTime: new Date(now.getTime() - 4 * 60 * 60 * 1000 - 34 * 60 * 1000).toISOString(), // 4ч 34м назад
    energyKwh: 42.5,
    cost: 595,
    status: 'active',
  });
  
  sessions.push({
    id: 'ses-active-2',
    stationId: 'st-4',
    connectorId: 'c-7',
    userId: '1',
    startTime: new Date(now.getTime() - 1 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString(), // 1ч 15м назад
    energyKwh: 28.3,
    cost: 396,
    status: 'active',
  });
  
  // 100 завершённых сессий
  for (let i = 0; i < 100; i++) {
    const daysAgo = Math.floor(i / 3); // Примерно 3 сессии в день
    const hoursOffset = (i % 3) * 6 + Math.random() * 4; // Распределение по часам
    
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysAgo);
    startDate.setHours(8 + hoursOffset, Math.floor(Math.random() * 60), 0);
    
    const durationMinutes = 30 + Math.floor(Math.random() * 300); // 30 мин - 5.5 часов
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

// Длинные названия для демонстрации
const extendedStations = [
  ...mockStations,
  {
    id: 'st-long',
    name: 'Супер-мега зарядная станция у торгового центра "Авиапарк" около метро Динамо',
    address: 'Ходынский бульвар, дом 4, строение 1, ТРЦ Авиапарк, подземный паркинг уровень -2, секция B',
    latitude: 55.789,
    longitude: 37.531,
    status: 'available' as const,
    connectors: [{ id: 'c-long', stationId: 'st-long', type: 'CCS' as const, powerKw: 150, status: 'available' as const }],
    ownerId: '1',
    createdAt: '2024-01-01T00:00:00Z',
  }
];

export default function SessionsPage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState(() => generateMockSessions());

  const activeSessions = sessions.filter(s => s.status === 'active');
  const completedSessions = sessions.filter(s => s.status !== 'active');

  // Группировка по датам
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
    
    // Сортируем даты от новых к старым
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

  const handleStopSession = (sessionId: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, status: 'completed' as const, endTime: new Date().toISOString() }
        : session
    ));
    toast({
      title: "Сессия остановлена",
      description: "Зарядка успешно завершена",
    });
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours} ч ${mins} м` : `${mins} м`;
  };

  const getStation = (stationId: string) => {
    return extendedStations.find(s => s.id === stationId) || mockStations.find(s => s.id === stationId);
  };

  return (
    <div className="space-y-6">
      {/* Активные сессии */}
      {activeSessions.length > 0 && (
        <div className="space-y-3">
          {activeSessions.map((session) => {
            const station = getStation(session.stationId);
            return (
              <ActiveSessionCard
                key={session.id}
                session={session}
                station={station}
                onStop={handleStopSession}
              />
            );
          })}
        </div>
      )}

      {/* История зарядных сессий */}
      <div className="space-y-4">
        <h1 className="text-xl font-bold">История зарядных сессий</h1>
        
        {groupedSessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Нет завершённых сессий</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                История зарядок появится здесь
              </p>
            </CardContent>
          </Card>
        ) : (
          groupedSessions.map((group) => (
            <div key={group.label} className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground px-1">
                {group.label}
              </h2>
              <div className="space-y-2">
                {group.sessions.map((session) => {
                  const station = getStation(session.stationId);
                  const connector = station?.connectors[0];
                  return (
                    <Card key={session.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {station && (
                              <p className="font-medium truncate">
                                {station.name}
                              </p>
                            )}
                            {station && (
                              <p className="text-sm text-muted-foreground truncate">
                                {station.address}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {formatDuration(session.startTime, session.endTime)}
                              </span>
                              {connector && (
                                <Badge variant="secondary" className="text-xs">
                                  {connector.type} · {connector.powerKw} кВт
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-semibold flex items-center gap-1">
                              <Zap className="h-4 w-4 text-primary" />
                              {session.energyKwh} кВт·ч
                            </p>
                            <p className="text-xs text-muted-foreground">Заряжено</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

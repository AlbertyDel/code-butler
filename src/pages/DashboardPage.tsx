import { memo, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CompactSessionCard } from '@/components/sessions/CompactSessionCard';
import { AddStationDialog } from '@/components/stations/AddStationDialog';
import { QuickLaunchCard } from '@/components/dashboard/QuickLaunchCard';
import { useStations } from '@/hooks/useStations';
import { useSessions } from '@/hooks/useSessions';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  MapPin, 
  TrendingUp, 
  BatteryCharging,
  Activity
} from 'lucide-react';
import type { ChargingSession, Station } from '@/types';

const MOCK_STATIONS: Station[] = [
  {
    id: 'mock-station-1',
    name: 'ТЦ Мега Парковка B2',
    address: 'ул. Ленина, 42',
    latitude: 55.75,
    longitude: 37.62,
    status: 'charging',
    connectors: [{ id: 'c1', stationId: 'mock-station-1', type: 'CCS', powerKw: 150, status: 'charging' }],
    ownerId: 'user-1',
    createdAt: new Date().toISOString(),
    electrical: { voltagePhase1: 230, voltagePhase2: 230, voltagePhase3: 230, phases: 3, maxCurrentA: 32, relayState: 'on' },
    temperature: { inputContacts: 35, port0: 40, port1: 38, internal: 42 },
    stats: { energyTodayKwh: 120, sessionsToday: 5, totalSessions: 342, totalEnergyKwh: 8500, totalHours: 1200 },
  },
  {
    id: 'mock-station-2',
    name: 'Офис Центральный',
    address: 'пр. Мира, 15',
    latitude: 55.76,
    longitude: 37.63,
    status: 'charging',
    connectors: [{ id: 'c2', stationId: 'mock-station-2', type: 'Type2', powerKw: 22, status: 'charging' }],
    ownerId: 'user-1',
    createdAt: new Date().toISOString(),
    electrical: { voltagePhase1: 230, voltagePhase2: 230, voltagePhase3: 230, phases: 3, maxCurrentA: 32, relayState: 'on' },
    temperature: { inputContacts: 30, port0: 35, port1: 33, internal: 37 },
    stats: { energyTodayKwh: 45, sessionsToday: 3, totalSessions: 156, totalEnergyKwh: 3200, totalHours: 600 },
  },
  {
    id: 'mock-station-3',
    name: 'АЗС Лукойл #47',
    address: 'Каширское шоссе, 61',
    latitude: 55.65,
    longitude: 37.64,
    status: 'available',
    connectors: [{ id: 'c3', stationId: 'mock-station-3', type: 'CHAdeMO', powerKw: 50, status: 'available' }],
    ownerId: 'user-1',
    createdAt: new Date().toISOString(),
    electrical: { voltagePhase1: 230, voltagePhase2: 230, voltagePhase3: 230, phases: 3, maxCurrentA: 32, relayState: 'on' },
    temperature: { inputContacts: 28, port0: 32, port1: 30, internal: 34 },
    stats: { energyTodayKwh: 78, sessionsToday: 4, totalSessions: 210, totalEnergyKwh: 5100, totalHours: 900 },
  },
];

const MOCK_ACTIVE_SESSIONS: ChargingSession[] = [
  {
    id: 'mock-session-1',
    stationId: 'mock-station-1',
    connectorId: 'c1',
    userId: 'user-1',
    startTime: new Date(Date.now() - 45 * 60000).toISOString(),
    energyKwh: 32.4,
    cost: 486,
    status: 'active',
  },
  {
    id: 'mock-session-2',
    stationId: 'mock-station-2',
    connectorId: 'c2',
    userId: 'user-1',
    startTime: new Date(Date.now() - 120 * 60000).toISOString(),
    energyKwh: 18.7,
    cost: 280.5,
    status: 'active',
  },
  {
    id: 'mock-session-3',
    stationId: 'mock-station-1',
    connectorId: 'c1',
    userId: 'user-2',
    startTime: new Date(Date.now() - 15 * 60000).toISOString(),
    energyKwh: 8.1,
    cost: 121.5,
    status: 'active',
  },
];

const MOCK_COMPLETED_SESSIONS: ChargingSession[] = [
  {
    id: 'mock-session-c1',
    stationId: 'mock-station-1',
    connectorId: 'c1',
    userId: 'user-1',
    startTime: new Date(Date.now() - 5 * 3600000).toISOString(),
    endTime: new Date(Date.now() - 4 * 3600000).toISOString(),
    energyKwh: 42.0,
    cost: 630,
    status: 'completed',
  },
  {
    id: 'mock-session-c2',
    stationId: 'mock-station-2',
    connectorId: 'c2',
    userId: 'user-1',
    startTime: new Date(Date.now() - 24 * 3600000).toISOString(),
    endTime: new Date(Date.now() - 23 * 3600000).toISOString(),
    energyKwh: 19.5,
    cost: 292.5,
    status: 'completed',
  },
  {
    id: 'mock-session-c3',
    stationId: 'mock-station-3',
    connectorId: 'c3',
    userId: 'user-1',
    startTime: new Date(Date.now() - 48 * 3600000).toISOString(),
    endTime: new Date(Date.now() - 47 * 3600000).toISOString(),
    energyKwh: 35.2,
    cost: 528,
    status: 'completed',
  },
];

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
}

const StatCard = memo(function StatCard({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  trend 
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{value}</span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3 text-primary" />
            <span className="text-primary">+{trend.value}%</span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default function DashboardPage() {
  const { stations: realStations, addStation, startCharging, isLoading: stationsLoading } = useStations();
  const { activeSessions: realActiveSessions, sessions: realSessions, isLoading: sessionsLoading } = useSessions();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showMock, setShowMock] = useState(() => {
    try { return localStorage.getItem('dashboard_mock') === '1'; } catch { return false; }
  });

  const handleToggleMock = (v: boolean) => {
    setShowMock(v);
    try { localStorage.setItem('dashboard_mock', v ? '1' : '0'); } catch {}
  };

  const stations = showMock ? MOCK_STATIONS : realStations;
  const sessions = showMock ? [...MOCK_ACTIVE_SESSIONS, ...MOCK_COMPLETED_SESSIONS] : realSessions;
  const activeSessions = showMock ? MOCK_ACTIVE_SESSIONS : realActiveSessions;

  // Calculate statistics from real data
  const statistics = useMemo(() => ({
    totalSessions: sessions.length,
    totalEnergyKwh: Number(sessions.reduce((sum, s) => sum + (Number(s.energyKwh) || 0), 0)).toFixed(1),
  }), [sessions]);

  const isLoading = !showMock && (stationsLoading || sessionsLoading);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 animate-pulse">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  const isEmpty = stations.length === 0 && activeSessions.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center text-center max-w-sm">
          <Activity className="h-16 w-16 text-muted-foreground/40" />
          <p className="mt-4 text-sm text-muted-foreground">
            Данные для аналитики отсутствуют. Добавьте зарядную станцию, чтобы начать сбор метрик и отслеживание активных сессий.
          </p>
          <Button className="mt-6" onClick={() => setIsAddDialogOpen(true)}>
            Добавить
          </Button>
          <AddStationDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onSubmit={addStation}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Статистика */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Всего сессий"
          value={statistics.totalSessions}
          icon={Zap}
          trend={{ value: 12, label: 'за месяц' }}
        />
        <StatCard
          title="Энергии получено"
          value={statistics.totalEnergyKwh}
          unit="кВт·ч"
          icon={TrendingUp}
          trend={{ value: 8, label: 'за месяц' }}
        />
        <StatCard
          title="Всего станций"
          value={stations.length}
          icon={MapPin}
        />
        <StatCard
          title="Активных сессий"
          value={activeSessions.length}
          icon={BatteryCharging}
        />
      </div>

      {/* Быстрый запуск */}
      <QuickLaunchCard stations={stations} onStart={startCharging} />

      {/* Активные сессии */}
      {activeSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Активные сессии</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {activeSessions.map((session) => (
              <CompactSessionCard
                key={session.id}
                session={session}
                station={stations.find(s => s.id === session.stationId)}
                onStop={(sessionId) => {
                  toast({
                    title: "Сессия остановлена",
                    description: "Зарядка успешно завершена",
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

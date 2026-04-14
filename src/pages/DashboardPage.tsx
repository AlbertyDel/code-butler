import { memo, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActiveSessionCard } from '@/components/sessions/ActiveSessionCard';
import { AddStationDialog } from '@/components/stations/AddStationDialog';
import { QuickLaunchCard } from '@/components/dashboard/QuickLaunchCard';
import { BusinessDashboard } from '@/components/dashboard/BusinessDashboard';
import { MockToggle } from '@/components/MockToggle';
import { useMockToggle } from '@/hooks/useMockToggle';
import { useStations } from '@/hooks/useStations';
import { useSessions } from '@/hooks/useSessions';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessState } from '@/contexts/BusinessStateContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  MapPin, 
  TrendingUp, 
  TrendingDown,
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
    currentAmps: 32,
    currentKw: 22.1,
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
    currentAmps: 16,
    currentKw: 7.4,
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
    // no currentAmps/currentKw — will show skeleton
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

// ── Business mock data (mode A) ──
const MOCK_BUSINESS_STATIONS: Station[] = [
  {
    id: 'biz-station-1',
    name: 'ТЦ Мега Парковка B2',
    address: 'ул. Ленина, 42',
    latitude: 55.75,
    longitude: 37.62,
    status: 'charging',
    connectors: [{ id: 'bc1', stationId: 'biz-station-1', type: 'CCS', powerKw: 150, status: 'charging' }],
    ownerId: 'user-1',
    createdAt: new Date().toISOString(),
    electrical: { voltagePhase1: 230, voltagePhase2: 230, voltagePhase3: 230, phases: 3, maxCurrentA: 32, relayState: 'on' },
    temperature: { inputContacts: 35, port0: 40, port1: 38, internal: 42 },
    stats: { energyTodayKwh: 120, sessionsToday: 5, totalSessions: 342, totalEnergyKwh: 8500, totalHours: 1200 },
  },
  {
    id: 'biz-station-2',
    name: 'Офис Центральный',
    address: 'пр. Мира, 15',
    latitude: 55.76,
    longitude: 37.63,
    status: 'available',
    connectors: [{ id: 'bc2', stationId: 'biz-station-2', type: 'Type2', powerKw: 22, status: 'available' }],
    ownerId: 'user-1',
    createdAt: new Date().toISOString(),
    electrical: { voltagePhase1: 230, voltagePhase2: 230, voltagePhase3: 230, phases: 3, maxCurrentA: 32, relayState: 'on' },
    temperature: { inputContacts: 30, port0: 35, port1: 33, internal: 37 },
    stats: { energyTodayKwh: 45, sessionsToday: 3, totalSessions: 156, totalEnergyKwh: 3200, totalHours: 600 },
  },
  {
    id: 'biz-station-3',
    name: 'АЗС Лукойл #47',
    address: 'Каширское шоссе, 61',
    latitude: 55.65,
    longitude: 37.64,
    status: 'offline',
    connectors: [{ id: 'bc3', stationId: 'biz-station-3', type: 'CHAdeMO', powerKw: 50, status: 'available' }],
    ownerId: 'user-1',
    createdAt: new Date().toISOString(),
    electrical: { voltagePhase1: 230, voltagePhase2: 230, voltagePhase3: 230, phases: 3, maxCurrentA: 32, relayState: 'on' },
    temperature: { inputContacts: 28, port0: 32, port1: 30, internal: 34 },
    stats: { energyTodayKwh: 0, sessionsToday: 0, totalSessions: 210, totalEnergyKwh: 5100, totalHours: 900 },
  },
  {
    id: 'biz-station-4',
    name: 'Парковка Сити Молл',
    address: 'ул. Профсоюзная, 22',
    latitude: 55.68,
    longitude: 37.57,
    status: 'maintenance',
    connectors: [{ id: 'bc4', stationId: 'biz-station-4', type: 'CCS', powerKw: 100, status: 'available' }],
    ownerId: 'user-1',
    createdAt: new Date().toISOString(),
    electrical: { voltagePhase1: 230, voltagePhase2: 230, voltagePhase3: 230, phases: 3, maxCurrentA: 32, relayState: 'on' },
    temperature: { inputContacts: 55, port0: 60, port1: 58, internal: 62 },
    stats: { energyTodayKwh: 12, sessionsToday: 1, totalSessions: 89, totalEnergyKwh: 2100, totalHours: 400 },
  },
  {
    id: 'biz-station-5',
    name: 'ЖК Солнечный',
    address: 'Бульвар Дмитрия Донского, 8',
    latitude: 55.59,
    longitude: 37.58,
    status: 'available',
    connectors: [{ id: 'bc5', stationId: 'biz-station-5', type: 'Type2', powerKw: 22, status: 'available' }],
    ownerId: 'user-1',
    createdAt: new Date().toISOString(),
    electrical: { voltagePhase1: 230, voltagePhase2: 230, voltagePhase3: 230, phases: 3, maxCurrentA: 32, relayState: 'on' },
    temperature: { inputContacts: 25, port0: 28, port1: 26, internal: 30 },
    stats: { energyTodayKwh: 67, sessionsToday: 4, totalSessions: 178, totalEnergyKwh: 4200, totalHours: 750 },
  },
];

const MOCK_BUSINESS_ACTIVE_SESSIONS: ChargingSession[] = [
  {
    id: 'biz-session-1',
    stationId: 'biz-station-1',
    connectorId: 'bc1',
    userId: 'user-ext-1',
    startTime: new Date(Date.now() - 45 * 60000).toISOString(),
    energyKwh: 32.4,
    cost: 486,
    status: 'active',
    currentAmps: 32,
    currentKw: 22.1,
  },
  {
    id: 'biz-session-2',
    stationId: 'biz-station-2',
    connectorId: 'bc2',
    userId: 'user-ext-2',
    startTime: new Date(Date.now() - 120 * 60000).toISOString(),
    energyKwh: 18.7,
    cost: 280.5,
    status: 'active',
    currentAmps: 16,
    currentKw: 7.4,
  },
];

const MOCK_BUSINESS_ALL_SESSIONS: ChargingSession[] = [
  ...MOCK_BUSINESS_ACTIVE_SESSIONS,
  {
    id: 'biz-session-c1',
    stationId: 'biz-station-1',
    connectorId: 'bc1',
    userId: 'user-ext-3',
    startTime: new Date(Date.now() - 5 * 3600000).toISOString(),
    endTime: new Date(Date.now() - 4 * 3600000).toISOString(),
    energyKwh: 42.0,
    cost: 630,
    status: 'completed',
  },
  {
    id: 'biz-session-c2',
    stationId: 'biz-station-5',
    connectorId: 'bc5',
    userId: 'user-ext-4',
    startTime: new Date(Date.now() - 24 * 3600000).toISOString(),
    endTime: new Date(Date.now() - 23 * 3600000).toISOString(),
    energyKwh: 19.5,
    cost: 292.5,
    status: 'completed',
  },
];

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  delta?: number;
}

const StatCard = memo(function StatCard({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  delta,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs text-muted-foreground whitespace-nowrap">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold tabular-nums">{value}</span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
            {delta !== undefined && (
              <div className="flex items-center gap-1 text-xs">
                {delta >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-primary" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span className={delta >= 0 ? 'text-primary' : 'text-destructive'}>
                  {delta >= 0 ? '+' : ''}{delta}%
                </span>
              </div>
            )}
          </div>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});


export default function DashboardPage() {
  const { stations: realStations, addStation, startCharging, isLoading: stationsLoading } = useStations();
  const { activeSessions: realActiveSessions, sessions: realSessions, stopSession, isLoading: sessionsLoading } = useSessions();
  const { userRole } = useAuth();
  const { businessState } = useBusinessState();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showMock, setShowMock] = useMockToggle('dashboard_mock');
  const isBusiness = userRole === 'business' || businessState === 'active';

  // Use separate mock data sets for business vs consumer
  const stations = showMock
    ? (isBusiness ? MOCK_BUSINESS_STATIONS : MOCK_STATIONS)
    : realStations;
  const sessions = showMock
    ? (isBusiness ? MOCK_BUSINESS_ALL_SESSIONS : [...MOCK_ACTIVE_SESSIONS, ...MOCK_COMPLETED_SESSIONS])
    : realSessions;
  const activeSessions = showMock
    ? (isBusiness ? MOCK_BUSINESS_ACTIVE_SESSIONS : MOCK_ACTIVE_SESSIONS)
    : realActiveSessions;

  // Calculate statistics from real data
  const statistics = useMemo(() => ({
    totalSessions: sessions.length,
    totalEnergyKwh: Number(sessions.reduce((sum, s) => sum + (Number(s.energyKwh) || 0), 0)).toFixed(1),
  }), [sessions]);

  const isLoading = !showMock && (stationsLoading || sessionsLoading);
  const isEmpty = !showMock && stations.length === 0 && activeSessions.length === 0;

  const mockToggle = <MockToggle checked={showMock} onCheckedChange={setShowMock} />;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {mockToggle}
        <div className="flex flex-1 items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 animate-pulse">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="space-y-6">
        {mockToggle}
        <div className="flex flex-1 items-center justify-center min-h-[40vh]">
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
      </div>
    );
  }

  // ── Business mode A dashboard ──
  if (isBusiness) {
    return (
      <div className="space-y-6">
        {mockToggle}
        <BusinessDashboard
          stations={stations}
          activeSessions={activeSessions}
          allSessions={sessions}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {mockToggle}

      {/* Статистика */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Сессий"
          value={statistics.totalSessions}
          icon={Zap}
          delta={12}
        />
        <StatCard
          title="Энергия"
          value={statistics.totalEnergyKwh}
          unit="кВт·ч"
          icon={TrendingUp}
          delta={8}
        />
        <StatCard
          title="Станций"
          value={stations.length}
          icon={MapPin}
        />
        <StatCard
          title="Активных сессий"
          value={activeSessions.length}
          icon={BatteryCharging}
        />
      </div>

      {/* Быстрый запуск с inline banner */}
      <QuickLaunchCard stations={stations} onStart={startCharging} />

      {/* Активные сессии */}
      {activeSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Активные сессии</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {activeSessions.map((session) => {
              const station = stations.find(s => s.id === session.stationId);
              return (
                <ActiveSessionCard
                  key={session.id}
                  session={session}
                  station={station}
                  onStop={(sessionId) => {
                    if (showMock) {
                      toast({ description: "Зарядка завершена" });
                    } else if (station) {
                      stopSession({ sessionId, deviceId: station.id });
                    }
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import { memo, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  const { stations, addStation, startCharging, isLoading: stationsLoading } = useStations();
  const { activeSessions, sessions, isLoading: sessionsLoading } = useSessions();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Calculate statistics from real data
  const statistics = useMemo(() => ({
    totalSessions: sessions.length,
    totalEnergyKwh: Number(sessions.reduce((sum, s) => sum + (Number(s.energyKwh) || 0), 0)).toFixed(1),
  }), [sessions]);

  const isLoading = stationsLoading || sessionsLoading;

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

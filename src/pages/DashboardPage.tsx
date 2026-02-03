import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockStations, mockSessions, mockStatistics } from '@/lib/mock-data';
import { StationCard } from '@/components/stations/StationCard';
import { CompactSessionCard } from '@/components/sessions/CompactSessionCard';
import { 
  Zap, 
  MapPin, 
  TrendingUp, 
  BatteryCharging
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Station } from '@/types';

function StatCard({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  unit?: string; 
  icon: React.ElementType;
  trend?: { value: number; label: string };
}) {
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
}

export default function DashboardPage() {
  const { toast } = useToast();
  const [stations, setStations] = useState<Station[]>(mockStations);
  
  const activeSessions = mockSessions.filter(s => s.status === 'active');

  const handleStartCharging = (stationId: string) => {
    setStations(prev => prev.map(station => 
      station.id === stationId 
        ? { ...station, status: 'charging' as const }
        : station
    ));
    toast({
      title: "Зарядка запущена",
      description: "Сессия зарядки успешно начата",
    });
  };

  const handleStopCharging = (stationId: string) => {
    setStations(prev => prev.map(station => 
      station.id === stationId 
        ? { ...station, status: 'available' as const }
        : station
    ));
    toast({
      title: "Зарядка остановлена",
      description: "Сессия зарядки завершена",
    });
  };

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Всего сессий"
          value={mockStatistics.totalSessions}
          icon={Zap}
          trend={{ value: 12, label: 'за месяц' }}
        />
        <StatCard
          title="Энергии получено"
          value={mockStatistics.totalEnergyKwh}
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
              />
            ))}
          </div>
        </div>
      )}

      {/* Станции */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Станции</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stations.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              onStart={handleStartCharging}
              onStop={handleStopCharging}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

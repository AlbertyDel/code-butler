import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { mockSessions, mockStatistics } from '@/lib/mock-data';
import { CompactSessionCard } from '@/components/sessions/CompactSessionCard';
import { useStations } from '@/hooks/useStations';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  MapPin, 
  TrendingUp, 
  BatteryCharging
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
  const { stations } = useStations();
  const { toast } = useToast();
  
  const activeSessions = mockSessions.filter(s => s.status === 'active');

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

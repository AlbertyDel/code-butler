import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { mockStations, mockSessions, mockStatistics } from '@/lib/mock-data';
import { 
  Zap, 
  MapPin, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  BatteryCharging
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

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

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    available: { label: 'Доступна', className: 'status-available' },
    charging: { label: 'Заряжает', className: 'status-charging' },
    offline: { label: 'Офлайн', className: 'status-offline' },
    maintenance: { label: 'Обслуживание', className: 'status-maintenance' },
  };

  const { label, className } = config[status] || config.offline;

  return (
    <Badge variant="outline" className={cn('rounded-full font-medium', className)}>
      {label}
    </Badge>
  );
}

export default function DashboardPage() {
  const { userRole } = useAuth();
  const navigate = useNavigate();

  const activeSession = mockSessions.find(s => s.status === 'active');
  const availableStations = mockStations.filter(s => s.status === 'available').length;

  return (
    <div className="space-y-6">
      {/* Приветствие */}
      <div>
        <h1 className="text-2xl font-bold">
          {userRole === 'business' ? 'Панель управления' : 'Добро пожаловать'}
        </h1>
        <p className="text-muted-foreground">
          {userRole === 'business' 
            ? 'Обзор станций и статистики' 
            : 'Управляйте зарядкой вашего электромобиля'}
        </p>
      </div>

      {/* Активная сессия */}
      {activeSession && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary animate-pulse-green">
                  <BatteryCharging className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold">Сессия #{activeSession.id.slice(-3)}</p>
                  <p className="text-sm text-muted-foreground">
                    Получено: {activeSession.energyKwh} кВт·ч
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {Math.round((activeSession.energyKwh / 50) * 100)}%
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/charging')}>
                  Подробнее
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Статистика */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Всего сессий"
          value={mockStatistics.totalSessions}
          icon={Zap}
          trend={{ value: 12, label: 'за месяц' }}
        />
        <StatCard
          title="Энергия"
          value={mockStatistics.totalEnergyKwh}
          unit="кВт·ч"
          icon={TrendingUp}
        />
        {userRole === 'business' ? (
          <StatCard
            title="Доход"
            value={mockStatistics.totalRevenue.toLocaleString()}
            unit="₽"
            icon={TrendingUp}
            trend={{ value: 8, label: 'за месяц' }}
          />
        ) : (
          <StatCard
            title="Расходы"
            value={mockStatistics.totalRevenue.toLocaleString()}
            unit="₽"
            icon={Clock}
          />
        )}
        <StatCard
          title="Активных станций"
          value={availableStations}
          unit={`из ${mockStations.length}`}
          icon={MapPin}
        />
      </div>

      {/* Станции */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Станции</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/stations')}>
            Все станции
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockStations.slice(0, 3).map((station) => (
            <div
              key={station.id}
              className="flex items-center justify-between rounded-xl border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
              onClick={() => navigate(`/stations/${station.id}`)}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  station.status === 'available' ? 'bg-green-500/10' :
                  station.status === 'charging' ? 'bg-blue-500/10' : 'bg-gray-500/10'
                )}>
                  <MapPin className={cn(
                    "h-5 w-5",
                    station.status === 'available' ? 'text-green-600' :
                    station.status === 'charging' ? 'text-blue-600' : 'text-gray-500'
                  )} />
                </div>
                <div>
                  <p className="font-medium">{station.name}</p>
                  <p className="text-sm text-muted-foreground">{station.address}</p>
                </div>
              </div>
              <StatusBadge status={station.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

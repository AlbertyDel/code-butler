import { memo, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  Wallet,
  Zap,
  Activity,
  Radio,
  AlertTriangle,
  WifiOff,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Clock,
  BatteryCharging,
} from 'lucide-react';
import type { Station, ChargingSession } from '@/types';

// --- Period filter ---
type PeriodKey = 'today' | '7d' | '30d' | 'custom';
const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Сегодня' },
  { key: '7d', label: '7 дней' },
  { key: '30d', label: '30 дней' },
  { key: 'custom', label: 'Свой период' },
];

// --- Mock aggregated data per period ---
interface AggregatedData {
  revenue: number;
  revenueDelta: number; // percent vs previous period
  energyKwh: number;
  sessionsCount: number;
  chartData: { label: string; revenue: number; energy: number }[];
}

const MOCK_AGGREGATED: Record<Exclude<PeriodKey, 'custom'>, AggregatedData> = {
  today: {
    revenue: 12_480,
    revenueDelta: 18,
    energyKwh: 891,
    sessionsCount: 47,
    chartData: [
      { label: '00', revenue: 0, energy: 0 },
      { label: '03', revenue: 120, energy: 9 },
      { label: '06', revenue: 450, energy: 32 },
      { label: '09', revenue: 1800, energy: 129 },
      { label: '12', revenue: 3200, energy: 229 },
      { label: '15', revenue: 3500, energy: 250 },
      { label: '18', revenue: 2100, energy: 150 },
      { label: '21', revenue: 1310, energy: 92 },
    ],
  },
  '7d': {
    revenue: 84_350,
    revenueDelta: 12,
    energyKwh: 6025,
    sessionsCount: 312,
    chartData: [
      { label: 'Пн', revenue: 11200, energy: 800 },
      { label: 'Вт', revenue: 10400, energy: 743 },
      { label: 'Ср', revenue: 12800, energy: 914 },
      { label: 'Чт', revenue: 13100, energy: 936 },
      { label: 'Пт', revenue: 14200, energy: 1014 },
      { label: 'Сб', revenue: 12150, energy: 868 },
      { label: 'Вс', revenue: 10500, energy: 750 },
    ],
  },
  '30d': {
    revenue: 347_200,
    revenueDelta: -3,
    energyKwh: 24_800,
    sessionsCount: 1_285,
    chartData: [
      { label: 'Нед 1', revenue: 82000, energy: 5857 },
      { label: 'Нед 2', revenue: 91000, energy: 6500 },
      { label: 'Нед 3', revenue: 87200, energy: 6229 },
      { label: 'Нед 4', revenue: 87000, energy: 6214 },
    ],
  },
};

// --- Chart config ---
const revenueChartConfig: ChartConfig = {
  revenue: { label: 'Выручка, ₽', color: 'hsl(var(--primary))' },
};
const energyChartConfig: ChartConfig = {
  energy: { label: 'Энергия, кВт·ч', color: 'hsl(142 71% 45%)' },
};

type ChartMetric = 'revenue' | 'energy';

// --- Helpers ---
function formatRub(v: number) {
  return v.toLocaleString('ru-RU') + ' ₽';
}
function formatKwh(v: number) {
  return v.toLocaleString('ru-RU') + ' кВт·ч';
}
function durationSince(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h} ч ${m % 60} мин`;
  return `${m} мин`;
}

// ============================================================
// Component
// ============================================================
interface BusinessDashboardProps {
  stations: Station[];
  activeSessions: ChargingSession[];
  allSessions: ChargingSession[];
}

export const BusinessDashboard = memo(function BusinessDashboard({
  stations,
  activeSessions,
  allSessions,
}: BusinessDashboardProps) {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodKey>('today');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('revenue');

  const agg = MOCK_AGGREGATED[period === 'custom' ? 'today' : period];

  const deltaLabel = useMemo(() => {
    switch (period) {
      case 'today': return 'к вчера';
      case '7d': return 'к прошлым 7 дням';
      case '30d': return 'к прошлым 30 дням';
      case 'custom': return 'к прошлому периоду';
    }
  }, [period]);

  // --- Live metrics ---
  const onlineCount = stations.filter(
    (s) => s.status === 'available' || s.status === 'charging'
  ).length;
  const totalCount = stations.length;
  const offlineStations = stations.filter((s) => s.status === 'offline');
  const errorStations = stations.filter((s) => s.status === 'maintenance');
  const problemStations = [...offlineStations, ...errorStations];
  const hasProblems = problemStations.length > 0;

  // Active sessions limited to 5
  const visibleSessions = activeSessions.slice(0, 5);

  // Problem stations limited to 5
  const visibleProblems = problemStations.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* ── Period filter ── */}
      <div className="flex flex-wrap items-center gap-2">
        {PERIOD_OPTIONS.map((opt) => (
          <Button
            key={opt.key}
            size="sm"
            variant={period === opt.key ? 'default' : 'outline'}
            onClick={() => setPeriod(opt.key)}
            className="whitespace-nowrap"
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* ── KPI ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Revenue — hero */}
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Выручка</p>
            <p className="mt-1 text-2xl font-bold">{formatRub(agg.revenue)}</p>
            <DeltaBadge value={agg.revenueDelta} label={deltaLabel} />
          </CardContent>
        </Card>

        <KpiCard
          label="Продано энергии"
          value={formatKwh(agg.energyKwh)}
          icon={Zap}
        />
        <KpiCard
          label="Сессий за период"
          value={agg.sessionsCount.toLocaleString('ru-RU')}
          icon={Activity}
        />
        <KpiCard
          label="Активные сессии"
          value={String(activeSessions.length)}
          icon={BatteryCharging}
          onClick={() => navigate('/sessions')}
        />
        <KpiCard
          label="В сети / всего"
          value={`${onlineCount} / ${totalCount}`}
          icon={Radio}
          onClick={() => navigate('/stations')}
        />
      </div>

      {/* ── Attention ── */}
      <Card>
        <CardContent className="p-4">
          {!hasProblems ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <Activity className="h-3.5 w-3.5 text-primary" />
              </div>
              Проблем нет
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">Требует внимания</p>
              {offlineStations.length > 0 && (
                <AttentionRow
                  icon={WifiOff}
                  text={`${offlineStations.length} ${pluralStations(offlineStations.length)} не в сети`}
                  onClick={() => navigate('/stations')}
                />
              )}
              {errorStations.length > 0 && (
                <AttentionRow
                  icon={AlertTriangle}
                  text={`${errorStations.length} ${pluralStations(errorStations.length)} с ошибкой`}
                  onClick={() => navigate('/stations')}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Chart ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Динамика</CardTitle>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={chartMetric === 'revenue' ? 'default' : 'ghost'}
                onClick={() => setChartMetric('revenue')}
                className="h-7 text-xs"
              >
                Выручка
              </Button>
              <Button
                size="sm"
                variant={chartMetric === 'energy' ? 'default' : 'ghost'}
                onClick={() => setChartMetric('energy')}
                className="h-7 text-xs"
              >
                Энергия
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <ChartContainer
            config={chartMetric === 'revenue' ? revenueChartConfig : energyChartConfig}
            className="h-[220px] w-full"
          >
            <BarChart data={agg.chartData} margin={{ left: 0, right: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey={chartMetric}
                radius={[4, 4, 0, 0]}
                fill={`var(--color-${chartMetric})`}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ── Bottom: Active Sessions + Problem Stations ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active sessions */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Активные сессии</CardTitle>
              {activeSessions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => navigate('/sessions')}
                >
                  Все
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {activeSessions.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Нет активных сессий
              </p>
            ) : (
              <div className="divide-y">
                {visibleSessions.map((s) => {
                  const station = stations.find((st) => st.id === s.stationId);
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {station?.name || s.stationId}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {durationSince(s.startTime)}
                          </span>
                          <span>{Number(s.energyKwh).toFixed(1)} кВт·ч</span>
                          {s.currentKw != null && (
                            <span>{s.currentKw} кВт</span>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-medium">
                        {formatRub(s.cost)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Problem stations */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Проблемные станции</CardTitle>
              {problemStations.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => navigate('/stations')}
                >
                  Все
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {problemStations.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Все станции работают
              </p>
            ) : (
              <div className="divide-y">
                {visibleProblems.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 cursor-pointer hover:bg-accent/50 -mx-2 px-2 rounded-lg transition-colors"
                    onClick={() => navigate('/stations')}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{st.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {st.address}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        st.status === 'offline'
                          ? 'border-destructive/30 bg-destructive/10 text-destructive'
                          : 'border-orange-300 bg-orange-50 text-orange-700'
                      }
                    >
                      {st.status === 'offline' ? 'Не в сети' : 'Ошибка'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

// ---- Sub-components ----

function KpiCard({
  label,
  value,
  icon: Icon,
  onClick,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  onClick?: () => void;
}) {
  return (
    <Card
      className={onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        {onClick && (
          <div className="mt-2 flex items-center gap-0.5 text-xs text-primary">
            Подробнее <ChevronRight className="h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DeltaBadge({ value, label }: { value: number; label: string }) {
  const positive = value >= 0;
  return (
    <div className="mt-1.5 flex items-center gap-1 text-xs">
      {positive ? (
        <TrendingUp className="h-3 w-3 text-primary" />
      ) : (
        <TrendingDown className="h-3 w-3 text-destructive" />
      )}
      <span className={positive ? 'text-primary' : 'text-destructive'}>
        {positive ? '+' : ''}
        {value}%
      </span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function AttentionRow({
  icon: Icon,
  text,
  onClick,
}: {
  icon: React.ElementType;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-left hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <Icon className="h-4 w-4 text-destructive shrink-0" />
      <span className="flex-1">{text}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}

function pluralStations(n: number): string {
  const mod = n % 10;
  const mod100 = n % 100;
  if (mod === 1 && mod100 !== 11) return 'станция';
  if (mod >= 2 && mod <= 4 && (mod100 < 12 || mod100 > 14)) return 'станции';
  return 'станций';
}

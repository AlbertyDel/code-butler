import { memo, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  TrendingUp,
  TrendingDown,
  BatteryCharging,
  CalendarIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Station, ChargingSession } from '@/types';
import type { DateRange } from 'react-day-picker';

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
  revenueDelta: number;
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

const MOCK_CUSTOM_AGGREGATED: AggregatedData = {
  revenue: 156_800,
  revenueDelta: 7,
  energyKwh: 11_200,
  sessionsCount: 580,
  chartData: [
    { label: 'Нед 1', revenue: 38000, energy: 2714 },
    { label: 'Нед 2', revenue: 42000, energy: 3000 },
    { label: 'Нед 3', revenue: 39800, energy: 2843 },
    { label: 'Нед 4', revenue: 37000, energy: 2643 },
  ],
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
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const agg = period === 'custom' ? MOCK_CUSTOM_AGGREGATED : MOCK_AGGREGATED[period];

  // --- Live metrics ---
  const onlineCount = stations.filter(
    (s) => s.status === 'available' || s.status === 'charging'
  ).length;
  const totalCount = stations.length;
  const offlineStations = stations.filter((s) => s.status === 'offline');
  const errorStations = stations.filter((s) => s.status === 'maintenance');
  const problemStations = [...offlineStations, ...errorStations];
  const hasProblems = problemStations.length > 0;

  const handlePeriodClick = (key: PeriodKey) => {
    if (key === 'custom') {
      setPeriod('custom');
      setCalendarOpen(true);
    } else {
      setPeriod(key);
      setDateRange(undefined);
    }
  };

  const customLabel = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, 'd MMM', { locale: ru })} – ${format(dateRange.to, 'd MMM', { locale: ru })}`;
    }
    return 'Свой период';
  }, [dateRange]);

  // Preview of problem station names (max 3)
  const problemPreviewNames = problemStations.slice(0, 3).map((s) => s.name);
  const problemRemaining = problemStations.length - problemPreviewNames.length;

  return (
    <div className="space-y-6">
      {/* ── Period filter ── */}
      <div className="flex flex-wrap items-center gap-2">
        {PERIOD_OPTIONS.map((opt) => (
          opt.key === 'custom' ? (
            <Popover key={opt.key} open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant={period === 'custom' ? 'default' : 'outline'}
                  onClick={() => handlePeriodClick('custom')}
                  className="whitespace-nowrap gap-1.5"
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {period === 'custom' ? customLabel : opt.label}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range);
                    if (range?.from && range?.to) {
                      setCalendarOpen(false);
                    }
                  }}
                  numberOfMonths={1}
                  disabled={(date) => date > new Date()}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          ) : (
            <Button
              key={opt.key}
              size="sm"
              variant={period === opt.key ? 'default' : 'outline'}
              onClick={() => handlePeriodClick(opt.key)}
              className="whitespace-nowrap"
            >
              {opt.label}
            </Button>
          )
        ))}
      </div>

      {/* ── KPI ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Revenue — hero */}
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Выручка</p>
            <p className="mt-1 text-2xl font-bold">{formatRub(agg.revenue)}</p>
            <DeltaBadge value={agg.revenueDelta} />
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
          ctaText="Открыть сессии"
        />
        <KpiCard
          label="В сети / всего"
          value={`${onlineCount} / ${totalCount}`}
          icon={Radio}
          onClick={() => navigate('/stations')}
          ctaText="Открыть станции"
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
            <div className="space-y-3">
              <p className="text-sm font-medium">Требует внимания</p>

              {/* Summary lines */}
              <div className="space-y-1">
                {offlineStations.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <WifiOff className="h-4 w-4 text-destructive shrink-0" />
                    <span>{offlineStations.length} {pluralStations(offlineStations.length)} не в сети</span>
                  </div>
                )}
                {errorStations.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <span>{errorStations.length} {pluralStations(errorStations.length)} с ошибкой</span>
                  </div>
                )}
              </div>

              {/* Preview names */}
              <p className="text-xs text-muted-foreground">
                {problemPreviewNames.join(', ')}
                {problemRemaining > 0 && ` +${problemRemaining} ещё`}
              </p>

              {/* Single CTA */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/stations')}
              >
                Открыть станции
              </Button>
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
    </div>
  );
});

// ---- Sub-components ----

function KpiCard({
  label,
  value,
  icon: Icon,
  onClick,
  ctaText,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  onClick?: () => void;
  ctaText?: string;
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
        {onClick && ctaText && (
          <p className="mt-2 text-xs text-primary">{ctaText}</p>
        )}
      </CardContent>
    </Card>
  );
}

function DeltaBadge({ value }: { value: number }) {
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
    </div>
  );
}

function pluralStations(n: number): string {
  const mod = n % 10;
  const mod100 = n % 100;
  if (mod === 1 && mod100 !== 11) return 'станция';
  if (mod >= 2 && mod <= 4 && (mod100 < 12 || mod100 > 14)) return 'станции';
  return 'станций';
}

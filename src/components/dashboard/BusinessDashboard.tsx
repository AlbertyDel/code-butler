import { memo, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
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
import { format, differenceInDays, addDays } from 'date-fns';
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
  energyDelta: number;
  sessionsCount: number;
  sessionsDelta: number;
  chartData: { label: string; revenue: number; energy: number }[];
}

const MOCK_AGGREGATED: Record<Exclude<PeriodKey, 'custom'>, AggregatedData> = {
  today: {
    revenue: 12_480,
    revenueDelta: 18,
    energyKwh: 891,
    energyDelta: 12,
    sessionsCount: 47,
    sessionsDelta: 8,
    chartData: [
      { label: '00:00', revenue: 0, energy: 0 },
      { label: '03:00', revenue: 120, energy: 9 },
      { label: '06:00', revenue: 450, energy: 32 },
      { label: '09:00', revenue: 1800, energy: 129 },
      { label: '12:00', revenue: 3200, energy: 229 },
      { label: '15:00', revenue: 3500, energy: 250 },
      { label: '18:00', revenue: 2100, energy: 150 },
      { label: '21:00', revenue: 1310, energy: 92 },
    ],
  },
  '7d': {
    revenue: 84_350,
    revenueDelta: 12,
    energyKwh: 6_025,
    energyDelta: 9,
    sessionsCount: 312,
    sessionsDelta: 5,
    chartData: [
      { label: '07.04', revenue: 11200, energy: 800 },
      { label: '08.04', revenue: 10400, energy: 743 },
      { label: '09.04', revenue: 12800, energy: 914 },
      { label: '10.04', revenue: 13100, energy: 936 },
      { label: '11.04', revenue: 14200, energy: 1014 },
      { label: '12.04', revenue: 12150, energy: 868 },
      { label: '13.04', revenue: 10500, energy: 750 },
    ],
  },
  '30d': {
    revenue: 1_347_200,
    revenueDelta: -3,
    energyKwh: 24_800,
    energyDelta: -1,
    sessionsCount: 1_285,
    sessionsDelta: -2,
    chartData: [
      { label: '15.03–18.03', revenue: 42000, energy: 3000 },
      { label: '19.03–22.03', revenue: 44000, energy: 3143 },
      { label: '23.03–26.03', revenue: 46500, energy: 3321 },
      { label: '27.03–30.03', revenue: 43200, energy: 3086 },
      { label: '31.03–03.04', revenue: 45100, energy: 3221 },
      { label: '04.04–07.04', revenue: 41000, energy: 2929 },
      { label: '08.04–11.04', revenue: 44400, energy: 3171 },
      { label: '12.04–14.04', revenue: 41000, energy: 2929 },
    ],
  },
};

const MOCK_CUSTOM_AGGREGATED: AggregatedData = {
  revenue: 156_800,
  revenueDelta: 7,
  energyKwh: 11_200,
  energyDelta: 4,
  sessionsCount: 580,
  sessionsDelta: 3,
  chartData: [
    { label: '01.03–04.03', revenue: 26000, energy: 1857 },
    { label: '05.03–08.03', revenue: 28000, energy: 2000 },
    { label: '09.03–12.03', revenue: 27500, energy: 1964 },
    { label: '13.03–16.03', revenue: 25800, energy: 1843 },
    { label: '17.03–20.03', revenue: 26200, energy: 1871 },
    { label: '21.03–24.03', revenue: 23300, energy: 1665 },
  ],
};

// --- Chart config ---
const ENERGY_COLOR = 'hsl(217 91% 60%)'; // blue-500

const revenueChartConfig: ChartConfig = {
  revenue: { label: 'Выручка', color: 'hsl(var(--primary))' },
};
const energyChartConfig: ChartConfig = {
  energy: { label: 'Энергия', color: ENERGY_COLOR },
};

type ChartMetric = 'revenue' | 'energy';

// --- Helpers ---
function formatCompact(v: number, unit: string): string {
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace('.', ',')} млн ${unit}`;
  }
  if (v >= 100_000) {
    const k = v / 1_000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1).replace('.', ',')} тыс ${unit}`;
  }
  return v.toLocaleString('ru-RU') + ' ' + unit;
}

function formatRub(v: number) {
  return formatCompact(v, '₽');
}
function formatKwh(v: number) {
  return formatCompact(v, 'кВт·ч');
}

function pluralProblems(n: number): string {
  const mod = n % 10;
  const mod100 = n % 100;
  if (mod === 1 && mod100 !== 11) return 'проблема';
  if (mod >= 2 && mod <= 4 && (mod100 < 12 || mod100 > 14)) return 'проблемы';
  return 'проблем';
}

function pluralStations(n: number): string {
  const mod = n % 10;
  const mod100 = n % 100;
  if (mod === 1 && mod100 !== 11) return 'станция';
  if (mod >= 2 && mod <= 4 && (mod100 < 12 || mod100 > 14)) return 'станции';
  return 'станций';
}

// Custom tooltip for the chart
function ChartCustomTooltip({ active, payload, chartMetric }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const value = item.value as number;
  const formatted = chartMetric === 'revenue'
    ? `${value.toLocaleString('ru-RU')} ₽`
    : `${value.toLocaleString('ru-RU')} кВт·ч`;

  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-1.5 text-xs shadow-xl">
      <div className="flex items-center gap-2">
        <div
          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
          style={{ backgroundColor: chartMetric === 'revenue' ? 'hsl(var(--primary))' : ENERGY_COLOR }}
        />
        <span className="font-medium tabular-nums">{formatted}</span>
      </div>
    </div>
  );
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
  const problemCount = problemStations.length;

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

  const problemPreviewNames = problemStations.slice(0, 3).map((s) => s.name);
  const problemRemaining = problemStations.length - problemPreviewNames.length;

  // Build summary parts
  const summaryParts: string[] = [];
  if (offlineStations.length > 0) summaryParts.push(`${offlineStations.length} не в сети`);
  if (errorStations.length > 0) summaryParts.push(`${errorStations.length} с ошибкой`);

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
        <KpiCard label="Выручка" value={formatRub(agg.revenue)} icon={Wallet} delta={agg.revenueDelta} />
        <KpiCard label="Энергия" value={formatKwh(agg.energyKwh)} icon={Zap} delta={agg.energyDelta} />
        <KpiCard label="Сессии" value={agg.sessionsCount.toLocaleString('ru-RU')} icon={Activity} delta={agg.sessionsDelta} />
        <KpiCard label="Активные" value={String(activeSessions.length)} icon={BatteryCharging} />
        <KpiCard label="Станции онлайн" value={`${onlineCount} / ${totalCount}`} icon={Radio} />
      </div>

      {/* ── Attention ── */}
      {hasProblems ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Требует внимания</p>
                  <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">
                    {problemCount} {pluralProblems(problemCount)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{summaryParts.join(' · ')}</p>
                <p className="text-xs text-muted-foreground">
                  {problemPreviewNames.join(', ')}
                  {problemRemaining > 0 && ` +${problemRemaining} ещё`}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1"
                  onClick={() => navigate('/stations')}
                >
                  Открыть станции
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <Activity className="h-3.5 w-3.5 text-primary" />
              </div>
              Все станции работают
            </div>
          </CardContent>
        </Card>
      )}

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
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} interval={0} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} />
              <Tooltip content={<ChartCustomTooltip chartMetric={chartMetric} />} />
              <Bar
                dataKey={chartMetric}
                radius={[4, 4, 0, 0]}
                fill={chartMetric === 'revenue' ? 'hsl(var(--primary))' : ENERGY_COLOR}
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
  delta,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  delta?: number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm text-muted-foreground whitespace-nowrap">{label}</p>
            <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
            {delta !== undefined && <DeltaBadge value={delta} />}
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DeltaBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <div className="flex items-center gap-1 text-xs">
      {positive ? (
        <TrendingUp className="h-3 w-3 text-primary" />
      ) : (
        <TrendingDown className="h-3 w-3 text-destructive" />
      )}
      <span className={positive ? 'text-primary' : 'text-destructive'}>
        {positive ? '+' : ''}{value}%
      </span>
    </div>
  );
}

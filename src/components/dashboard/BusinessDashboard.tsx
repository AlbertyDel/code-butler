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
  type ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import {
  Wallet,
  Zap,
  Activity,
  Radio,
  AlertTriangle,
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
import { useIsMobile } from '@/hooks/use-mobile';

// --- Responsive helpers ---
function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState(false);
  React.useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsTablet(w >= 768 && w < 1024);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isTablet;
}

import * as React from 'react';

/** Aggregate chart data into maxBuckets by summing adjacent points */
function aggregateBuckets(
  data: { label: string; revenue: number; energy: number }[],
  maxBuckets: number,
): { label: string; revenue: number; energy: number }[] {
  if (data.length <= maxBuckets) return data;
  const bucketSize = Math.ceil(data.length / maxBuckets);
  const result: { label: string; revenue: number; energy: number }[] = [];
  for (let i = 0; i < data.length; i += bucketSize) {
    const slice = data.slice(i, i + bucketSize);
    const revenue = slice.reduce((s, d) => s + d.revenue, 0);
    const energy = slice.reduce((s, d) => s + d.energy, 0);
    // Build compact label from first–last in slice
    const first = slice[0].label;
    const last = slice[slice.length - 1].label;
    const label = slice.length === 1 ? first : `${first.split('–')[0]}–${last.includes('–') ? last.split('–')[1] : last}`;
    result.push({ label, revenue, energy });
  }
  return result;
}

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
      { label: '15.03–21.03', revenue: 86000, energy: 6143 },
      { label: '22.03–28.03', revenue: 89700, energy: 6407 },
      { label: '29.03–04.04', revenue: 88300, energy: 6307 },
      { label: '05.04–11.04', revenue: 85600, energy: 6100 },
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
    { label: '01.03–05.03', revenue: 32000, energy: 2286 },
    { label: '06.03–10.03', revenue: 34500, energy: 2464 },
    { label: '11.03–15.03', revenue: 31800, energy: 2271 },
    { label: '16.03–20.03', revenue: 30200, energy: 2157 },
    { label: '21.03–24.03', revenue: 28300, energy: 2022 },
  ],
};

// --- Chart config ---
const ENERGY_COLOR = 'hsl(217 91% 60%)';

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

function formatEnergy(v: number): string {
  if (v >= 10_000) {
    const mwh = v / 1_000;
    return `${mwh % 1 === 0 ? mwh.toFixed(0) : mwh.toFixed(1).replace('.', ',')} МВт·ч`;
  }
  return `${v.toLocaleString('ru-RU')} кВт·ч`;
}

function formatEnergyTooltip(v: number): string {
  if (v >= 10_000) {
    const mwh = v / 1_000;
    return `${mwh % 1 === 0 ? mwh.toFixed(0) : mwh.toFixed(1).replace('.', ',')} МВт·ч`;
  }
  return `${v.toLocaleString('ru-RU')} кВт·ч`;
}

function pluralProblems(n: number): string {
  const mod = n % 10;
  const mod100 = n % 100;
  if (mod === 1 && mod100 !== 11) return 'проблема';
  if (mod >= 2 && mod <= 4 && (mod100 < 12 || mod100 > 14)) return 'проблемы';
  return 'проблем';
}

// Custom tooltip
function ChartCustomTooltip({ active, payload, chartMetric }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const value = item.value as number;
  const label = item.payload?.label || '';
  const formatted = chartMetric === 'revenue'
    ? `${value.toLocaleString('ru-RU')} ₽`
    : formatEnergyTooltip(value);

  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-1.5 text-xs shadow-xl">
      {label && <p className="mb-1 text-muted-foreground">{label}</p>}
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
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [period, setPeriod] = useState<PeriodKey>('today');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('revenue');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const agg = period === 'custom' ? MOCK_CUSTOM_AGGREGATED : MOCK_AGGREGATED[period];

  // Responsive chart data: aggregate buckets for smaller screens
  const displayChartData = useMemo(() => {
    const maxBuckets = isMobile ? 4 : isTablet ? 5 : 999;
    return aggregateBuckets(agg.chartData, maxBuckets);
  }, [agg.chartData, isMobile, isTablet]);

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

  // Build summary chips
  const summaryChips: string[] = [];
  if (offlineStations.length > 0) summaryChips.push(`${offlineStations.length} офлайн`);
  if (errorStations.length > 0) summaryChips.push(`${errorStations.length} ошибка`);

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
        <KpiCard label="Энергия" value={formatEnergy(agg.energyKwh)} icon={Zap} delta={agg.energyDelta} />
        <KpiCard label="Сессий всего" value={agg.sessionsCount.toLocaleString('ru-RU')} icon={Activity} delta={agg.sessionsDelta} />
        <KpiCard
          label="Активных сессий"
          value={String(activeSessions.length)}
          icon={BatteryCharging}
          cta="К сессиям"
          onCtaClick={() => navigate('/sessions')}
        />
        <KpiCard
          label="ЗС онлайн"
          value={`${onlineCount} / ${totalCount}`}
          icon={Radio}
          cta="К станциям"
          onCtaClick={() => navigate('/stations')}
        />
      </div>

      {/* ── Attention strip ── */}
      {hasProblems && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-medium">
              {problemCount} {pluralProblems(problemCount)}
            </span>
            {summaryChips.map((chip) => (
              <span
                key={chip}
                className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive"
              >
                {chip}
              </span>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 whitespace-nowrap"
            onClick={() => navigate('/stations')}
          >
            К станциям
          </Button>
        </div>
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
            <BarChart data={displayChartData} margin={{ left: 0, right: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                interval={0}
              />
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
  cta,
  onCtaClick,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  delta?: number;
  cta?: string;
  onCtaClick?: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs text-muted-foreground whitespace-nowrap">{label}</p>
            <p className="text-xl font-bold tabular-nums leading-tight truncate">{value}</p>
            {delta !== undefined && <DeltaBadge value={delta} />}
            {cta && onCtaClick && (
              <button
                onClick={onCtaClick}
                className="text-xs font-medium text-primary hover:underline"
              >
                {cta}
              </button>
            )}
          </div>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-3.5 w-3.5 text-primary" />
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

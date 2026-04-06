import { memo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BatteryCharging, Clock, Zap, MapPin, Square, Gauge, Activity } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SessionStatusBanner } from '@/components/sessions/SessionStatusBanner';
import { useSessionFlow } from '@/contexts/SessionFlowContext';
import { SESSION_FLOW_BANNER_MAP } from '@/types/session-flow';
import type { ChargingSession, Station } from '@/types';

interface ActiveSessionCardProps {
  session: ChargingSession;
  station?: Station;
  onStop: (sessionId: string) => void;
}

export const ActiveSessionCard = memo(function ActiveSessionCard({
  session,
  station,
  onStop,
}: ActiveSessionCardProps) {
  const { flowState } = useSessionFlow();
  const bannerConfig =
    flowState === 'connection_recovery' || flowState === 'waiting_for_station_response'
      ? SESSION_FLOW_BANNER_MAP[flowState]
      : undefined;

  const [timeLabel, setTimeLabel] = useState(() => formatElapsed(session.startTime));

  useEffect(() => {
    const id = setInterval(() => setTimeLabel(formatElapsed(session.startTime)), 1000);
    return () => clearInterval(id);
  }, [session.startTime]);

  const stopDialog = (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Остановить сессию?</AlertDialogTitle>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Отмена</AlertDialogCancel>
        <AlertDialogAction
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={() => onStop(session.id)}
        >
          Остановить
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 space-y-4">
        {/* ── Top row: icon + station + stop ── */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary animate-pulse">
            <BatteryCharging className="h-4 w-4 text-primary-foreground" />
          </div>

          <div className="min-w-0 flex-1">
            {station && (
              <p className="text-sm font-semibold leading-tight truncate flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="truncate">{station.name}</span>
              </p>
            )}
            {station && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{station.address}</p>
            )}
          </div>

          {/* Stop — icon-only on mobile/tablet, label on lg+ */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8 shrink-0 lg:hidden"
                aria-label="Остановить"
              >
                <Square className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            {stopDialog}
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="hidden lg:inline-flex gap-1.5 h-8 px-3 text-xs shrink-0"
              >
                <Square className="h-3 w-3" />
                Остановить
              </Button>
            </AlertDialogTrigger>
            {stopDialog}
          </AlertDialog>
        </div>

        {/* ── Metrics ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric icon={Clock} value={timeLabel} label="Время" />
          <Metric icon={Zap} value={session.energyKwh} label="кВт·ч" />
          <Metric icon={Activity} value={session.currentAmps} label="А" />
          <Metric icon={Gauge} value={session.currentKw} label="кВт" />
        </div>

        {/* ── Flow banner ── */}
        {bannerConfig && (
          <SessionStatusBanner config={bannerConfig} />
        )}
      </CardContent>
    </Card>
  );
}, (prev, next) => {
  const p = prev.session;
  const n = next.session;
  return (
    p.id === n.id &&
    p.energyKwh === n.energyKwh &&
    p.currentAmps === n.currentAmps &&
    p.currentKw === n.currentKw &&
    p.status === n.status &&
    prev.station?.id === next.station?.id
  );
});

/* ── Metric cell ── */
function Metric({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value?: string | number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {value == null ? (
        <Skeleton className="h-5 w-10 rounded" />
      ) : (
        <span className="text-base font-semibold leading-tight">{value}</span>
      )}
      <span className="text-[11px] text-muted-foreground leading-tight">{label}</span>
    </div>
  );
}

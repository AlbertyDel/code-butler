import { memo } from 'react';
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

  const startTime = new Date(session.startTime);
  const now = new Date();
  const durationMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const timeLabel = hours > 0 ? `${hours} ч ${minutes} м` : `${minutes} м`;

  return (
    <Card className="border-primary/30 bg-primary/5 overflow-hidden">
      <CardContent className="p-0">
        {/* ── Top row: icon + station + stop ── */}
        <div className="flex items-center gap-3 p-4 pb-0">
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

          {/* Stop — icon-only on mobile, label on md+ */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8 shrink-0 md:hidden"
                aria-label="Остановить"
              >
                <Square className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
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
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="hidden md:inline-flex gap-1.5 h-8 px-3 text-xs shrink-0"
              >
                <Square className="h-3 w-3" />
                Остановить
              </Button>
            </AlertDialogTrigger>
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
          </AlertDialog>
        </div>

        {/* ── Metrics 2×2 → 4-col ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border mt-4">
          <Metric icon={Clock} value={timeLabel} label="Время" />
          <Metric icon={Zap} value={session.energyKwh} label="кВт·ч" />
          <Metric icon={Activity} value={session.currentAmps} label="А" />
          <Metric icon={Gauge} value={session.currentKw} label="кВт" />
        </div>

        {/* ── Flow banner ── */}
        {bannerConfig && (
          <div className="p-3 pt-0 mt-3">
            <SessionStatusBanner config={bannerConfig} />
          </div>
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
    <div className="flex flex-col items-center justify-center gap-0.5 bg-primary/5 py-3 px-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {value == null ? (
        <Skeleton className="h-5 w-10 rounded mt-0.5" />
      ) : (
        <span className="text-base font-semibold leading-tight">{value}</span>
      )}
      <span className="text-[11px] text-muted-foreground leading-tight">{label}</span>
    </div>
  );
}

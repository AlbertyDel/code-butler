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
  onStop 
}: ActiveSessionCardProps) {
  const { flowState } = useSessionFlow();
  const bannerConfig = (flowState === 'connection_recovery' || flowState === 'waiting_for_station_response')
    ? SESSION_FLOW_BANNER_MAP[flowState]
    : undefined;

  const startTime = new Date(session.startTime);
  const now = new Date();
  const durationMs = now.getTime() - startTime.getTime();
  const durationMinutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4">
        {/* Header: station info + stop button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary animate-pulse">
              <BatteryCharging className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              {station && (
                <p className="font-semibold text-sm flex items-center gap-1 truncate">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{station.name}</span>
                </p>
              )}
              {station && (
                <p className="text-xs text-muted-foreground truncate">{station.address}</p>
              )}
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm"
                className="gap-1 shrink-0 text-xs h-8 px-3"
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

        {/* Metrics grid: 2x2 on mobile, 4 cols on sm+ */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricItem
            icon={Clock}
            value={hours > 0 ? `${hours} ч ${minutes} м` : `${minutes} м`}
            label="Время"
          />
          <MetricItem
            icon={Zap}
            value={session.energyKwh}
            label="кВт·ч"
          />
          <MetricItem
            icon={Activity}
            value={session.currentAmps}
            label="А"
          />
          <MetricItem
            icon={Gauge}
            value={session.currentKw}
            label="кВт"
          />
        </div>

        {bannerConfig && (
          <SessionStatusBanner config={bannerConfig} className="mt-3" />
        )}
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  const p = prevProps.session;
  const n = nextProps.session;
  return p.id === n.id &&
    p.energyKwh === n.energyKwh &&
    p.currentAmps === n.currentAmps &&
    p.currentKw === n.currentKw &&
    p.status === n.status &&
    prevProps.station?.id === nextProps.station?.id;
});

/* ---- small helper ---- */
function MetricItem({ icon: Icon, value, label }: { icon: React.ElementType; value?: string | number; label: string }) {
  return (
    <div className="text-center space-y-1">
      <div className="flex items-center justify-center text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      {value == null ? (
        <Skeleton className="h-6 w-12 mx-auto rounded" />
      ) : (
        <p className="text-lg font-semibold leading-tight">{value}</p>
      )}
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

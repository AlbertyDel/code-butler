import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BatteryCharging, Zap, Square } from 'lucide-react';
import type { ChargingSession, Station } from '@/types';

interface CompactSessionCardProps {
  session: ChargingSession;
  station?: Station;
  onStop?: (sessionId: string) => void;
}

export const CompactSessionCard = memo(function CompactSessionCard({ 
  session, 
  station,
  onStop 
}: CompactSessionCardProps) {
  const startTime = new Date(session.startTime);
  const now = new Date();
  const durationMs = now.getTime() - startTime.getTime();
  const durationMinutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  const targetKwh = 50;
  const progress = Math.min((session.energyKwh / targetKwh) * 100, 100);
  
  const connector = station?.connectors[0];

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary animate-pulse">
            <BatteryCharging className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm truncate block">{station?.name || 'Станция'}</span>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span>{hours > 0 ? `${hours} ч ` : ''}{minutes} м</span>
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {session.energyKwh} кВт·ч
              </span>
              {connector && <span>{connector.powerKw} кВт</span>}
            </div>
          </div>
          {onStop && (
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onStop(session.id)}
            >
              <Square className="h-3 w-3" />
            </Button>
          )}
          <div className="w-12 h-12 relative">
            <svg className="w-full h-full -rotate-90 animate-[spin_8s_linear_infinite]" viewBox="0 0 36 36">
              <circle
                className="text-secondary"
                strokeWidth="3"
                stroke="currentColor"
                fill="transparent"
                r="15"
                cx="18"
                cy="18"
              />
            </svg>
            <svg className="w-full h-full -rotate-90 absolute inset-0" viewBox="0 0 36 36">
              <circle
                className="text-primary transition-all"
                strokeWidth="3"
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="15"
                cx="18"
                cy="18"
                strokeDasharray={`${progress * 0.94} 100`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for compact session cards
  const prevSession = prevProps.session;
  const nextSession = nextProps.session;
  return prevSession.id === nextSession.id &&
    prevSession.energyKwh === nextSession.energyKwh &&
    prevSession.status === nextSession.status &&
    prevProps.station?.id === nextProps.station?.id;
});

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
              className="h-10 w-10 shrink-0"
              onClick={() => onStop(session.id)}
            >
              <Square className="h-4 w-4" />
            </Button>
          )}
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

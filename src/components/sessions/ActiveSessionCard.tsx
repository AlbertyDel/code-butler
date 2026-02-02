import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BatteryCharging, Clock, Zap, MapPin, Square } from 'lucide-react';
import type { ChargingSession, Station } from '@/types';
import { cn } from '@/lib/utils';

interface ActiveSessionCardProps {
  session: ChargingSession;
  station?: Station;
  onStop: (sessionId: string) => void;
}

export function ActiveSessionCard({ session, station, onStop }: ActiveSessionCardProps) {
  const startTime = new Date(session.startTime);
  const now = new Date();
  const durationMs = now.getTime() - startTime.getTime();
  const durationMinutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  // Примерный расчёт прогресса (предполагаем целевое значение 50 кВт·ч)
  const targetKwh = 50;
  const progress = Math.min((session.energyKwh / targetKwh) * 100, 100);

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary animate-pulse">
              <BatteryCharging className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Сессия #{session.id.slice(-4)}</span>
                <Badge className="bg-primary text-primary-foreground">Активна</Badge>
              </div>
              {station && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {station.name}
                </p>
              )}
            </div>
          </div>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => onStop(session.id)}
            className="gap-1"
          >
            <Square className="h-3 w-3" />
            Остановить
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Прогресс зарядки</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
              </div>
              <p className="mt-1 text-lg font-semibold">
                {hours > 0 ? `${hours}ч ` : ''}{minutes}м
              </p>
              <p className="text-xs text-muted-foreground">Время</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Zap className="h-4 w-4" />
              </div>
              <p className="mt-1 text-lg font-semibold">{session.energyKwh}</p>
              <p className="text-xs text-muted-foreground">кВт·ч</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <span className="text-sm">₽</span>
              </div>
              <p className="mt-1 text-lg font-semibold">{session.cost}</p>
              <p className="text-xs text-muted-foreground">Стоимость</p>
            </div>
          </div>

          {station?.connectors[0] && (
            <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{station.connectors[0].type}</Badge>
              <span>·</span>
              <span>{station.connectors[0].powerKw} кВт</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { memo, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import type { Station } from '@/types';

interface QuickLaunchCardProps {
  stations: Station[];
  onStart: (stationId: string) => void;
}

export const QuickLaunchCard = memo(function QuickLaunchCard({
  stations,
  onStart,
}: QuickLaunchCardProps) {
  const availableStations = useMemo(
    () => stations.filter((s) => s.status === 'available'),
    [stations]
  );

  const hasAvailable = availableStations.length > 0;

  const [selectedId, setSelectedId] = useState<string>(
    availableStations[0]?.id ?? ''
  );

  const currentSelectedId =
    hasAvailable && availableStations.find((s) => s.id === selectedId)
      ? selectedId
      : availableStations[0]?.id ?? '';

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          Быстрый запуск
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>

            <select
              value={hasAvailable ? currentSelectedId : ''}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={!hasAvailable}
              className="h-11 w-full min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {!hasAvailable ? (
                <option value="">Нет доступных станций</option>
              ) : (
                availableStations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Свободна)
                  </option>
                ))
              )}
            </select>
          </div>

          <p className="shrink-0 text-xs text-muted-foreground sm:max-w-[220px]">
            {hasAvailable
              ? 'Подключите коннектор к автомобилю и запустите станцию.'
              : 'В данный момент все станции заняты или не в сети. Вы можете управлять активными сессиями ниже.'}
          </p>

          <Button
            disabled={!hasAvailable}
            className="h-11 shrink-0 sm:ml-auto"
            onClick={() => onStart(currentSelectedId)}
          >
            <Zap className="mr-2 h-4 w-4" />
            Запустить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

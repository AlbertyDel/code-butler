import { memo, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

  // Keep selectedId in sync if stations change
  const currentSelectedId =
    hasAvailable && availableStations.find((s) => s.id === selectedId)
      ? selectedId
      : availableStations[0]?.id ?? '';

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Быстрый запуск
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Icon + Select */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>

            <Select
              value={hasAvailable ? currentSelectedId : undefined}
              onValueChange={setSelectedId}
              disabled={!hasAvailable}
            >
              <SelectTrigger className="flex-1 min-w-0">
                <SelectValue
                  placeholder={
                    hasAvailable
                      ? 'Выберите станцию'
                      : 'Нет доступных станций'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableStations.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} (Свободна)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hint text */}
          <p className="text-xs text-muted-foreground sm:max-w-[220px] shrink-0">
            {hasAvailable
              ? 'Подключите коннектор к автомобилю и запустите станцию.'
              : 'В данный момент все станции заняты или не в сети. Вы можете управлять активными сессиями ниже.'}
          </p>

          {/* Launch button */}
          <Button
            disabled={!hasAvailable}
            className="shrink-0 sm:ml-auto"
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

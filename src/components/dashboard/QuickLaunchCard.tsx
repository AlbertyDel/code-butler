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
import { SessionStatusBanner } from '@/components/sessions/SessionStatusBanner';
import { useSessionFlow } from '@/contexts/SessionFlowContext';
import { SESSION_FLOW_BANNER_MAP } from '@/types/session-flow';
import type { Station } from '@/types';

const statusConfig: Record<string, { color: string; disabled: boolean }> = {
  available: { color: 'bg-green-500', disabled: false },
  charging: { color: 'bg-blue-500', disabled: true },
  offline: { color: 'bg-red-500', disabled: true },
  maintenance: { color: 'bg-red-500', disabled: true },
};

interface QuickLaunchCardProps {
  stations: Station[];
  onStart: (stationId: string) => void;
}

export const QuickLaunchCard = memo(function QuickLaunchCard({
  stations,
  onStart,
}: QuickLaunchCardProps) {
  const { flowState, dismissConnectorBanner } = useSessionFlow();

  // Show only waiting_for_connector banner in QuickLaunchCard
  const bannerConfig = flowState === 'waiting_for_connector'
    ? SESSION_FLOW_BANNER_MAP[flowState]
    : undefined;

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

  const selectedStation = stations.find((s) => s.id === currentSelectedId);

  const handleStationChange = (value: string) => {
    setSelectedId(value);
    dismissConnectorBanner();
  };

  const handleStart = () => {
    dismissConnectorBanner();
    onStart(currentSelectedId);
  };

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

            <Select
              value={hasAvailable ? currentSelectedId : ''}
              onValueChange={handleStationChange}
              disabled={!hasAvailable}
            >
              <SelectTrigger className="h-11 w-full min-w-0 flex-1">
                <SelectValue placeholder="Нет доступных станций">
                  {selectedStation ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-green-500" />
                      {selectedStation.name}
                    </span>
                  ) : (
                    'Нет доступных станций'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {stations.map((s) => {
                  const cfg = statusConfig[s.status] ?? statusConfig.offline;
                  return (
                    <SelectItem
                      key={s.id}
                      value={s.id}
                      disabled={cfg.disabled}
                      className={cfg.disabled ? 'opacity-50 pointer-events-none' : ''}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${cfg.color}`}
                        />
                        {s.name}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <p className="shrink-0 text-xs text-muted-foreground sm:max-w-[220px]">
            {hasAvailable
              ? 'Подключите коннектор к автомобилю и запустите станцию.'
              : 'В данный момент все станции заняты или не в сети. Вы можете управлять активными сессиями ниже.'}
          </p>

          <Button
            disabled={!hasAvailable}
            className="h-11 shrink-0 sm:ml-auto"
            onClick={handleStart}
          >
            <Zap className="mr-2 h-4 w-4" />
            Запустить
          </Button>
        </div>

        {bannerConfig && (
          <SessionStatusBanner config={bannerConfig} className="mt-3" />
        )}
      </CardContent>
    </Card>
  );
});

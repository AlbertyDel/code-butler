import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Play, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Station, ChargerStatus } from '@/types';

interface StationCardProps {
  station: Station;
  onStart?: (stationId: string) => void;
  onStop?: (stationId: string) => void;
  showActions?: boolean;
}

interface StatusBadgeProps {
  status: ChargerStatus;
}

const StatusBadge = memo(function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<ChargerStatus, { label: string; className: string }> = {
    available: { label: 'Работает', className: 'status-available' },
    charging: { label: 'Заряжает', className: 'status-charging' },
    offline: { label: 'Не работает', className: 'status-offline' },
    maintenance: { label: 'Не работает', className: 'status-offline' },
  };

  const { label, className } = config[status];

  return (
    <Badge variant="outline" className={cn('rounded-full font-medium', className)}>
      {label}
    </Badge>
  );
});

export const StationCard = memo(function StationCard({ 
  station, 
  onStart, 
  onStop, 
  showActions = true 
}: StationCardProps) {
  const openInYandexMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://yandex.ru/maps/?pt=${station.longitude},${station.latitude}&z=17&l=map`;
    window.open(url, '_blank');
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <button
              onClick={openInYandexMaps}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl cursor-pointer transition-colors hover:opacity-80",
                station.status === 'available' ? 'bg-primary/10' :
                station.status === 'charging' ? 'bg-accent' : 'bg-muted'
              )}
              title="Открыть на Яндекс Картах"
            >
              <MapPin className={cn(
                "h-5 w-5",
                station.status === 'available' ? 'text-primary' :
                station.status === 'charging' ? 'text-accent-foreground' : 'text-muted-foreground'
              )} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{station.name}</h3>
                <StatusBadge status={station.status} />
              </div>
              <p className="text-sm text-muted-foreground truncate">{station.address}</p>
            </div>
          </div>
          
          {showActions && (
            <div className="shrink-0">
              {station.status === 'available' && onStart && (
                <Button 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onStart(station.id);
                  }}
                  className="gap-1"
                >
                  <Play className="h-3 w-3" />
                  Запустить
                </Button>
              )}
              {station.status === 'charging' && onStop && (
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStop(station.id);
                  }}
                  className="gap-1"
                >
                  <Square className="h-3 w-3" />
                  Остановить
                </Button>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-3 flex flex-wrap gap-1">
          {station.connectors.map((connector) => (
            <Badge key={connector.id} variant="secondary" className="text-xs">
              {connector.type} · {connector.powerKw} кВт
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if station data or callbacks changed
  const prev = prevProps.station;
  const next = nextProps.station;
  return prev.id === next.id &&
    prev.name === next.name &&
    prev.address === next.address &&
    prev.status === next.status &&
    prev.connectors.length === next.connectors.length &&
    prevProps.showActions === nextProps.showActions;
});

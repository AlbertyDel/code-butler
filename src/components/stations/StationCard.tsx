import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Play, Square, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Station } from '@/types';

interface StationCardProps {
  station: Station;
  onStart?: (stationId: string) => void;
  onStop?: (stationId: string) => void;
  showActions?: boolean;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    available: { label: 'Работает', className: 'status-available' },
    charging: { label: 'Заряжает', className: 'status-charging' },
    offline: { label: 'Не работает', className: 'status-offline' },
    maintenance: { label: 'Не работает', className: 'status-offline' },
  };

  const { label, className } = config[status] || config.offline;

  return (
    <Badge variant="outline" className={cn('rounded-full font-medium', className)}>
      {label}
    </Badge>
  );
}

export function StationCard({ station, onStart, onStop, showActions = true }: StationCardProps) {
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
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              station.status === 'available' ? 'bg-green-500/10' :
              station.status === 'charging' ? 'bg-blue-500/10' : 'bg-gray-500/10'
            )}>
              <MapPin className={cn(
                "h-5 w-5",
                station.status === 'available' ? 'text-green-600' :
                station.status === 'charging' ? 'text-blue-600' : 'text-gray-500'
              )} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{station.name}</h3>
                <StatusBadge status={station.status} />
              </div>
              <p className="text-sm text-muted-foreground truncate">{station.address}</p>
              <button
                onClick={openInYandexMaps}
                className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Открыть на карте
              </button>
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
}

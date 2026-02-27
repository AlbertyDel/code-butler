import { useState, memo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStations } from '@/hooks/useStations';
import { 
  MapPin, 
  Plus,
  Pencil,
  Trash2,
  Plug,
  Play,
  Square
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddStationDialog } from '@/components/stations/AddStationDialog';
import { DeleteStationDialog } from '@/components/stations/DeleteStationDialog';
import { StationDetailSheet } from '@/components/stations/StationDetailSheet';
import type { Station, ChargerStatus } from '@/types';

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

interface StationRowProps {
  station: Station;
  onEdit: (station: Station) => void;
  onDelete: (station: Station) => void;
  onOpenMaps: (e: React.MouseEvent, station: Station) => void;
  onSelect: (station: Station) => void;
  onStart: (stationId: string) => void;
  onStop: (stationId: string) => void;
}

const StationRow = memo(function StationRow({ 
  station, 
  onEdit, 
  onDelete, 
  onOpenMaps,
  onSelect,
  onStart,
  onStop
}: StationRowProps) {
  return (
    <Card className="transition-shadow hover:shadow-md cursor-pointer" onClick={() => onSelect(station)}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <button
              onClick={(e) => onOpenMaps(e, station)}
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
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{station.name}</h3>
                <StatusBadge status={station.status} />
              </div>
              <p className="text-sm text-muted-foreground truncate">{station.address}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {station.connectors.map((connector) => (
                  <Badge key={connector.id} variant="secondary" className="text-xs">
                    {connector.type} · {connector.powerKw} кВт
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end shrink-0 items-center">
            {station.status === 'available' && (
              <Button
                onClick={(e) => { e.stopPropagation(); onStart(station.id); }}
                className="gap-1.5 w-[130px] h-10"
              >
                <Play className="h-4 w-4" />
                Запустить
              </Button>
            )}
            {station.status === 'charging' && (
              <Button
                variant="destructive"
                onClick={(e) => { e.stopPropagation(); onStop(station.id); }}
                className="gap-1.5 w-[130px] h-10"
              >
                <Square className="h-4 w-4" />
                Остановить
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={(e) => { e.stopPropagation(); onEdit(station); }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={(e) => { e.stopPropagation(); onDelete(station); }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if station data changed
  const prev = prevProps.station;
  const next = nextProps.station;
  return prev.id === next.id &&
    prev.name === next.name &&
    prev.address === next.address &&
    prev.status === next.status &&
    prev.connectors.length === next.connectors.length;
});

export default function StationsPage() {
  const { stations, addStation, updateStation, deleteStation, startCharging, stopCharging } = useStations();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editStation, setEditStation] = useState<Station | null>(null);
  const [stationToDelete, setStationToDelete] = useState<Station | null>(null);
  const [detailStation, setDetailStation] = useState<Station | null>(null);

  const handleEditStation = useCallback((stationData: Partial<Station>) => {
    updateStation(stationData);
    setEditStation(null);
  }, [updateStation]);

  const handleDeleteStation = useCallback(() => {
    if (!stationToDelete) return;
    deleteStation(stationToDelete.id);
    setStationToDelete(null);
  }, [stationToDelete, deleteStation]);

  const openInYandexMaps = useCallback((e: React.MouseEvent, station: Station) => {
    e.stopPropagation();
    const url = `https://yandex.ru/maps/?pt=${station.longitude},${station.latitude}&z=17&l=map`;
    window.open(url, '_blank');
  }, []);

  const handleEdit = useCallback((station: Station) => {
    setEditStation(station);
  }, []);

  const handleDelete = useCallback((station: Station) => {
    setStationToDelete(station);
  }, []);

  const handleSelect = useCallback((station: Station) => {
    setDetailStation(station);
  }, []);

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Станции</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить
        </Button>
      </div>

      {/* Список станций */}
      <div className="space-y-3">
        {stations.length === 0 ? (
          <div className="flex flex-1 items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center text-center max-w-sm">
              <Plug className="h-16 w-16 text-muted-foreground/40" />
              <p className="mt-4 text-sm text-muted-foreground">
                У вас пока нет добавленных станций. Давайте подключим первую — система сама определит её мощность и порты.
              </p>
              <Button className="mt-6" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить
              </Button>
            </div>
          </div>
        ) : (
          stations.map((station) => (
            <StationRow
              key={station.id}
              station={station}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onOpenMaps={openInYandexMaps}
              onSelect={handleSelect}
              onStart={startCharging}
              onStop={stopCharging}
            />
          ))
        )}
      </div>

      {/* Диалог добавления */}
      <AddStationDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={addStation}
      />

      {/* Диалог редактирования */}
      <AddStationDialog
        open={!!editStation}
        onOpenChange={(open) => !open && setEditStation(null)}
        onSubmit={handleEditStation}
        editStation={editStation}
      />

      {/* Диалог удаления */}
      <DeleteStationDialog
        open={!!stationToDelete}
        onOpenChange={(open) => !open && setStationToDelete(null)}
        stationName={stationToDelete?.name || ''}
        onConfirm={handleDeleteStation}
      />

      {/* Панель деталей */}
      <StationDetailSheet
        station={detailStation}
        open={!!detailStation}
        onOpenChange={(open) => !open && setDetailStation(null)}
      />
    </div>
  );
}

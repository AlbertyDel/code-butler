import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockStations } from '@/lib/mock-data';
import { 
  MapPin, 
  Plus,
  Pencil,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AddStationDialog } from '@/components/stations/AddStationDialog';
import { DeleteStationDialog } from '@/components/stations/DeleteStationDialog';
import type { Station } from '@/types';

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

export default function StationsPage() {
  const { toast } = useToast();
  const [stations, setStations] = useState<Station[]>(mockStations);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editStation, setEditStation] = useState<Station | null>(null);
  const [deleteStation, setDeleteStation] = useState<Station | null>(null);

  const handleAddStation = (stationData: Partial<Station>) => {
    const newStation = stationData as Station;
    setStations(prev => [...prev, newStation]);
    toast({
      title: "Станция добавлена",
      description: `${newStation.name} успешно добавлена`,
    });
  };

  const handleEditStation = (stationData: Partial<Station>) => {
    setStations(prev => prev.map(station =>
      station.id === stationData.id ? { ...station, ...stationData } : station
    ));
    setEditStation(null);
    toast({
      title: "Станция обновлена",
      description: "Изменения сохранены",
    });
  };

  const handleDeleteStation = () => {
    if (!deleteStation) return;
    setStations(prev => prev.filter(s => s.id !== deleteStation.id));
    toast({
      title: "Станция удалена",
      description: `${deleteStation.name} была удалена`,
    });
    setDeleteStation(null);
  };

  const openInYandexMaps = (e: React.MouseEvent, station: Station) => {
    e.stopPropagation();
    const url = `https://yandex.ru/maps/?pt=${station.longitude},${station.latitude}&z=17&l=map`;
    window.open(url, '_blank');
  };

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
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Нет станций</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Добавьте первую зарядную станцию
              </p>
              <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить станцию
              </Button>
            </CardContent>
          </Card>
        ) : (
          stations.map((station) => (
            <Card key={station.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={(e) => openInYandexMaps(e, station)}
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl cursor-pointer transition-colors hover:opacity-80",
                        station.status === 'available' ? 'bg-primary/10' :
                        station.status === 'charging' ? 'bg-blue-500/10' : 'bg-muted'
                      )}
                      title="Открыть на Яндекс Картах"
                    >
                      <MapPin className={cn(
                        "h-6 w-6",
                        station.status === 'available' ? 'text-primary' :
                        station.status === 'charging' ? 'text-blue-600' : 'text-muted-foreground'
                      )} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{station.name}</h3>
                        <StatusBadge status={station.status} />
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{station.address}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {station.connectors.map((connector) => (
                          <Badge key={connector.id} variant="secondary" className="text-xs">
                            {connector.type} · {connector.powerKw} кВт
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditStation(station)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setDeleteStation(station)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Диалог добавления */}
      <AddStationDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddStation}
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
        open={!!deleteStation}
        onOpenChange={(open) => !open && setDeleteStation(null)}
        stationName={deleteStation?.name || ''}
        onConfirm={handleDeleteStation}
      />
    </div>
  );
}

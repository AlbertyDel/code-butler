import { useState, memo, useCallback, useEffect, useSyncExternalStore } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStations } from '@/hooks/useStations';
import { MockToggle } from '@/components/MockToggle';
import { useMockToggle } from '@/hooks/useMockToggle';
import { mockStations } from '@/lib/mock-data';
import { hasErrors } from '@/lib/station-errors';
import { 
  MapPin, 
  Pencil,
  Trash2,
  Plug,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddStationDialog } from '@/components/stations/AddStationDialog';
import { DeleteStationDialog } from '@/components/stations/DeleteStationDialog';
import { StationDetailSheet } from '@/components/stations/StationDetailSheet';
import type { Station, ChargerStatus } from '@/types';
import { getSharedTariffs, subscribeToTariffs, type TariffLocal } from '@/pages/TariffsPage';

export interface StationWithTariff extends Station {
  tariffId?: string;
}

// Shared station state for cross-page access (e.g. tariff deletion protection)
let _sharedStations: StationWithTariff[] = [];
let _stationListeners: Array<() => void> = [];

export function getSharedStations(): StationWithTariff[] {
  return _sharedStations;
}

export function subscribeToStations(listener: () => void): () => void {
  _stationListeners.push(listener);
  return () => {
    _stationListeners = _stationListeners.filter(l => l !== listener);
  };
}

function setSharedStations(stations: StationWithTariff[]) {
  _sharedStations = stations;
  _stationListeners.forEach(l => l());
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
    <Badge variant="outline" className={cn('w-fit shrink-0 whitespace-nowrap rounded-full font-medium', className)}>
      {label}
    </Badge>
  );
});

function getEffectiveTariff(station: StationWithTariff, tariffs: TariffLocal[]): { name: string; isIndividual: boolean } | null {
  if (tariffs.length === 0) return null;
  if (station.tariffId) {
    const t = tariffs.find(tr => tr.id === station.tariffId);
    if (t) return { name: t.name, isIndividual: true };
  }
  const def = tariffs.find(t => t.isDefault);
  if (def) return { name: def.name, isIndividual: false };
  return null;
}

interface StationRowProps {
  station: StationWithTariff;
  onEdit: (station: StationWithTariff) => void;
  onDelete: (station: StationWithTariff) => void;
  onOpenMaps: (e: React.MouseEvent, station: Station) => void;
  onSelect: (station: Station) => void;
  tariffs: TariffLocal[];
}

const StationRow = memo(function StationRow({ 
  station, 
  onEdit, 
  onDelete, 
  onOpenMaps,
  onSelect,
  tariffs,
}: StationRowProps) {
  const effectiveTariff = getEffectiveTariff(station, tariffs);

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
              <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold line-clamp-2 break-words">{station.name}</h3>
                  {hasErrors(station.errorBits) && (
                    <span title="Есть ошибки"><AlertTriangle className="h-4 w-4 shrink-0 text-destructive" /></span>
                  )}
                </div>
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
              {effectiveTariff && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Тариф: {effectiveTariff.name}
                  <span className="ml-1.5 opacity-60">
                    · {effectiveTariff.isIndividual ? 'Индивидуальный' : 'Основной'}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-end shrink-0 items-center">
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11"
              onClick={(e) => { e.stopPropagation(); onEdit(station); }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11"
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
  const prev = prevProps.station;
  const next = nextProps.station;
  return prev.id === next.id &&
    prev.name === next.name &&
    prev.address === next.address &&
    prev.status === next.status &&
    prev.connectors.length === next.connectors.length &&
    prev.errorBits === next.errorBits &&
    (prev as StationWithTariff).tariffId === (next as StationWithTariff).tariffId &&
    prevProps.tariffs === nextProps.tariffs;
});

export default function StationsPage() {
  const { stations: realStations, addStation: realAddStation, updateStation: realUpdateStation, deleteStation: realDeleteStation } = useStations();
  const [showMock, setShowMock] = useMockToggle('stations_mock');
  const [mockLocalStations, setMockLocalStations] = useState<StationWithTariff[]>(() => [...mockStations]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editStation, setEditStation] = useState<StationWithTariff | null>(null);
  const [stationToDelete, setStationToDelete] = useState<Station | null>(null);
  const [detailStation, setDetailStation] = useState<Station | null>(null);

  const tariffs = useSyncExternalStore(subscribeToTariffs, getSharedTariffs);
  const stations: StationWithTariff[] = showMock ? mockLocalStations : realStations;

  // Sync shared stations for tariff page access
  useEffect(() => {
    setSharedStations(stations);
  }, [stations]);

  const handleAddStation = useCallback((stationData: Partial<Station> & { tariffId?: string }) => {
    if (showMock) {
      const newStation: StationWithTariff = {
        id: `mock-new-${Date.now()}`,
        name: stationData.name || 'Новая станция',
        address: stationData.address || '',
        latitude: stationData.latitude || 55.75,
        longitude: stationData.longitude || 37.62,
        status: 'available',
        connectors: [{ id: `c-new-${Date.now()}`, stationId: `mock-new-${Date.now()}`, type: 'Type2', powerKw: 22, status: 'available' }],
        ownerId: 'user-1',
        createdAt: new Date().toISOString(),
        electrical: { voltagePhase1: 230, voltagePhase2: 230, voltagePhase3: 230, phases: 3, maxCurrentA: 32, relayState: 'on' },
        temperature: { inputContacts: 30, port0: 30, port1: 30, internal: 30 },
        stats: { energyTodayKwh: 0, sessionsToday: 0, totalSessions: 0, totalEnergyKwh: 0, totalHours: 0 },
        tariffId: stationData.tariffId,
      };
      setMockLocalStations(prev => [...prev, newStation]);
    } else {
      realAddStation(stationData);
    }
  }, [showMock, realAddStation]);

  const handleEditStation = useCallback((stationData: Partial<Station> & { tariffId?: string }) => {
    if (!editStation) return;
    if (showMock) {
      setMockLocalStations(prev => prev.map(s =>
        s.id === editStation.id ? { ...s, ...stationData, tariffId: stationData.tariffId } : s
      ));
    } else {
      realUpdateStation({ id: editStation.id, data: stationData });
    }
    setEditStation(null);
  }, [editStation, showMock, realUpdateStation]);

  const handleDeleteStation = useCallback(() => {
    if (!stationToDelete) return;
    if (showMock) {
      setMockLocalStations(prev => prev.filter(s => s.id !== stationToDelete.id));
    } else {
      realDeleteStation(stationToDelete.id);
    }
    setStationToDelete(null);
  }, [stationToDelete, showMock, realDeleteStation]);

  const openInYandexMaps = useCallback((e: React.MouseEvent, station: Station) => {
    e.stopPropagation();
    const url = `https://yandex.ru/maps/?pt=${station.longitude},${station.latitude}&z=17&l=map`;
    window.open(url, '_blank');
  }, []);

  const handleEdit = useCallback((station: StationWithTariff) => {
    setEditStation(station);
  }, []);

  const handleDelete = useCallback((station: Station) => {
    setStationToDelete(station);
  }, []);

  const handleSelect = useCallback((station: Station) => {
    setDetailStation(station);
  }, []);

  const mockToggle = <MockToggle checked={showMock} onCheckedChange={setShowMock} />;

  return (
    <div className="space-y-6 sm:space-y-8">
      {mockToggle}

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Станции</h1>

      <div className="space-y-3">
        {stations.length === 0 ? (
          <div className="flex flex-1 items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center text-center max-w-sm">
              <Plug className="h-16 w-16 text-muted-foreground/40" />
              <p className="mt-4 text-sm text-muted-foreground">
                У вас пока нет добавленных станций. Давайте подключим первую — система сама определит ее мощность и порты.
              </p>
              <Button className="mt-6" onClick={() => setIsAddDialogOpen(true)}>
                Добавить
              </Button>
            </div>
          </div>
        ) : (
          <>
            {stations.map((station) => (
              <StationRow
                key={station.id}
                station={station}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onOpenMaps={openInYandexMaps}
                onSelect={handleSelect}
                tariffs={tariffs}
              />
            ))}
            <div className="flex justify-center pt-4">
              <Button onClick={() => setIsAddDialogOpen(true)}>
                Добавить
              </Button>
            </div>
          </>
        )}
      </div>

      <AddStationDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddStation}
      />

      <AddStationDialog
        open={!!editStation}
        onOpenChange={(open) => !open && setEditStation(null)}
        onSubmit={handleEditStation}
        editStation={editStation}
      />

      <DeleteStationDialog
        open={!!stationToDelete}
        onOpenChange={(open) => !open && setStationToDelete(null)}
        stationName={stationToDelete?.name || ''}
        onConfirm={handleDeleteStation}
      />

      <StationDetailSheet
        station={detailStation}
        open={!!detailStation}
        onOpenChange={(open) => !open && setDetailStation(null)}
      />
    </div>
  );
}

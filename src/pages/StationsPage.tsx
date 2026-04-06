import { useState, memo, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStations } from '@/hooks/useStations';
import { MockToggle } from '@/components/MockToggle';
import { useMockToggle } from '@/hooks/useMockToggle';
import { mockStations } from '@/lib/mock-data';
import { SessionStatusBanner } from '@/components/sessions/SessionStatusBanner';
import { useSessionFlow } from '@/contexts/SessionFlowContext';
import { SESSION_FLOW_BANNER_MAP } from '@/types/session-flow';
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
                className="gap-1.5 w-[140px] h-11"
              >
                <Play className="h-4 w-4" />
                Запустить
              </Button>
            )}
            {station.status === 'charging' && (
              <Button
                variant="destructive"
                onClick={(e) => { e.stopPropagation(); onStop(station.id); }}
                className="gap-1.5 w-[140px] h-11"
              >
                <Square className="h-4 w-4" />
                Остановить
              </Button>
            )}
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
    prev.connectors.length === next.connectors.length;
});

export default function StationsPage() {
  const { stations: realStations, addStation: realAddStation, updateStation: realUpdateStation, deleteStation: realDeleteStation, startCharging: realStartCharging, stopCharging: realStopCharging } = useStations();
  const [showMock, setShowMock] = useMockToggle('stations_mock');
  const [mockLocalStations, setMockLocalStations] = useState<Station[]>(() => [...mockStations]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editStation, setEditStation] = useState<Station | null>(null);
  const [stationToDelete, setStationToDelete] = useState<Station | null>(null);
  const [detailStation, setDetailStation] = useState<Station | null>(null);

  const stations = showMock ? mockLocalStations : realStations;

  const handleAddStation = useCallback((stationData: Partial<Station>) => {
    if (showMock) {
      const newStation: Station = {
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
      };
      setMockLocalStations(prev => [...prev, newStation]);
    } else {
      realAddStation(stationData);
    }
  }, [showMock, realAddStation]);

  const handleEditStation = useCallback((stationData: Partial<Station>) => {
    if (!editStation) return;
    if (showMock) {
      setMockLocalStations(prev => prev.map(s =>
        s.id === editStation.id ? { ...s, ...stationData } : s
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

  const handleStartCharging = useCallback((stationId: string) => {
    if (showMock) {
      setMockLocalStations(prev => prev.map(s =>
        s.id === stationId ? {
          ...s,
          status: 'charging' as const,
          connectors: s.connectors.map((c, i) =>
            i === 0 ? { ...c, status: 'charging' as const } : c
          ),
        } : s
      ));
    } else {
      realStartCharging(stationId);
    }
  }, [showMock, realStartCharging]);

  const handleStopCharging = useCallback((stationId: string) => {
    if (showMock) {
      setMockLocalStations(prev => prev.map(s =>
        s.id === stationId ? {
          ...s,
          status: 'available' as const,
          connectors: s.connectors.map(c =>
            c.status === 'charging' ? { ...c, status: 'available' as const } : c
          ),
        } : s
      ));
    } else {
      realStopCharging(stationId);
    }
  }, [showMock, realStopCharging]);

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

  const mockToggle = <MockToggle checked={showMock} onCheckedChange={setShowMock} />;

  const { flowState } = useSessionFlow();
  const bannerConfig = SESSION_FLOW_BANNER_MAP[flowState];

  return (
    <div className="space-y-6 sm:space-y-8">
      {mockToggle}

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Станции</h1>

      {bannerConfig && <SessionStatusBanner config={bannerConfig} />}

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
                onStart={handleStartCharging}
                onStop={handleStopCharging}
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

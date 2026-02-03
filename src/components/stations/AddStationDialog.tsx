import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Station } from '@/types';

interface AddStationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (station: Partial<Station>) => void;
  editStation?: Station | null;
}

function generateStationId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'CHG-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function AddStationDialog({ open, onOpenChange, onSubmit, editStation }: AddStationDialogProps) {
  const [stationId, setStationId] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('55.751244');
  const [longitude, setLongitude] = useState('37.618423');
  const [portsCount, setPortsCount] = useState('2');
  const [powerKw, setPowerKw] = useState('22');

  // Синхронизируем значения при изменении editStation или открытии
  useEffect(() => {
    if (open) {
      if (editStation) {
        setStationId(editStation.id);
        setName(editStation.name);
        setAddress(editStation.address);
        setLatitude(editStation.latitude.toString());
        setLongitude(editStation.longitude.toString());
        setPortsCount(editStation.connectors.length.toString());
        setPowerKw(editStation.connectors[0]?.powerKw?.toString() || '22');
      } else {
        setStationId(generateStationId());
        setName('');
        setAddress('');
        setLatitude('55.751244');
        setLongitude('37.618423');
        setPortsCount('2');
        setPowerKw('22');
      }
    }
  }, [open, editStation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const portsNum = parseInt(portsCount) || 1;
    const connectors = Array.from({ length: portsNum }, (_, i) => ({
      id: `c-${Date.now()}-${i}`,
      stationId: editStation?.id || stationId,
      type: 'Type2' as const,
      powerKw: parseInt(powerKw),
      status: 'available' as const,
    }));

    onSubmit({
      id: editStation?.id || stationId,
      name,
      address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      status: editStation?.status || 'available',
      connectors,
      ownerId: '1',
      createdAt: editStation?.createdAt || new Date().toISOString(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editStation ? 'Редактировать станцию' : 'Добавить станцию'}
          </DialogTitle>
          <DialogDescription>
            {editStation 
              ? 'Измените параметры зарядной станции'
              : 'Заполните данные новой зарядной станции'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название станции</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stationId">ID станции</Label>
              <Input
                id="stationId"
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                maxLength={8}
                required
                disabled={!!editStation}
              />
              <p className="text-xs text-muted-foreground">8 символов, например: CHG-1000</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Адрес</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Широта</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Долгота</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ports">Кол-во портов</Label>
                <Input
                  id="ports"
                  type="number"
                  min="1"
                  max="10"
                  value={portsCount}
                  onChange={(e) => setPortsCount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="power">Мощность (кВт)</Label>
                <Input
                  id="power"
                  type="number"
                  value={powerKw}
                  onChange={(e) => setPowerKw(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit">
              {editStation ? 'Сохранить' : 'Добавить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

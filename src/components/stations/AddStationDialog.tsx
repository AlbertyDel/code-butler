import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Station, ConnectorType } from '@/types';

interface AddStationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (station: Partial<Station>) => void;
  editStation?: Station | null;
}

const connectorTypes: ConnectorType[] = ['Type2', 'CCS', 'CHAdeMO', 'GB/T'];

export function AddStationDialog({ open, onOpenChange, onSubmit, editStation }: AddStationDialogProps) {
  const [name, setName] = useState(editStation?.name || '');
  const [address, setAddress] = useState(editStation?.address || '');
  const [latitude, setLatitude] = useState(editStation?.latitude?.toString() || '55.751244');
  const [longitude, setLongitude] = useState(editStation?.longitude?.toString() || '37.618423');
  const [connectorType, setConnectorType] = useState<ConnectorType>(
    editStation?.connectors[0]?.type || 'Type2'
  );
  const [powerKw, setPowerKw] = useState(
    editStation?.connectors[0]?.powerKw?.toString() || '22'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: editStation?.id || `st-${Date.now()}`,
      name,
      address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      status: editStation?.status || 'available',
      connectors: [{
        id: `c-${Date.now()}`,
        stationId: editStation?.id || `st-${Date.now()}`,
        type: connectorType,
        powerKw: parseInt(powerKw),
        status: 'available',
      }],
      ownerId: '1',
      createdAt: editStation?.createdAt || new Date().toISOString(),
    });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setAddress('');
    setLatitude('55.751244');
    setLongitude('37.618423');
    setConnectorType('Type2');
    setPowerKw('22');
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
                placeholder="ЭЗС Москва-Сити"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Адрес</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ул. Примерная, 1"
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
                <Label>Тип коннектора</Label>
                <Select value={connectorType} onValueChange={(v) => setConnectorType(v as ConnectorType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {connectorTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

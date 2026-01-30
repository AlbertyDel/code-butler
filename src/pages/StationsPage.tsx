import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { mockStations } from '@/lib/mock-data';
import { 
  MapPin, 
  Search, 
  SlidersHorizontal, 
  Zap,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { ConnectorType } from '@/types';

const connectorTypes: { type: ConnectorType; label: string }[] = [
  { type: 'Type2', label: 'Type 2' },
  { type: 'CCS', label: 'CCS' },
  { type: 'CHAdeMO', label: 'CHAdeMO' },
  { type: 'GB/T', label: 'GB/T AC' },
];

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    available: { label: 'Доступна', className: 'status-available' },
    charging: { label: 'Заряжает', className: 'status-charging' },
    offline: { label: 'Офлайн', className: 'status-offline' },
    maintenance: { label: 'Обслуживание', className: 'status-maintenance' },
  };

  const { label, className } = config[status] || config.offline;

  return (
    <Badge variant="outline" className={cn('rounded-full font-medium', className)}>
      {label}
    </Badge>
  );
}

export default function StationsPage() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    connectorTypes: [] as ConnectorType[],
    powerRange: [7, 150] as [number, number],
    onlyAvailable: false,
    nearbyOnly: false,
  });

  // ⚠️ Бизнес-логика фильтрации - не изменять
  const filteredStations = mockStations.filter((station) => {
    // Поиск по названию/адресу
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!station.name.toLowerCase().includes(query) && 
          !station.address.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Фильтр по типу коннектора
    if (filters.connectorTypes.length > 0) {
      const hasConnector = station.connectors.some(c => 
        filters.connectorTypes.includes(c.type)
      );
      if (!hasConnector) return false;
    }

    // Фильтр по мощности
    const stationPower = Math.max(...station.connectors.map(c => c.powerKw));
    if (stationPower < filters.powerRange[0] || stationPower > filters.powerRange[1]) {
      return false;
    }

    // Только доступные
    if (filters.onlyAvailable && station.status !== 'available') {
      return false;
    }

    return true;
  });

  const toggleConnectorType = (type: ConnectorType) => {
    setFilters(prev => ({
      ...prev,
      connectorTypes: prev.connectorTypes.includes(type)
        ? prev.connectorTypes.filter(t => t !== type)
        : [...prev.connectorTypes, type]
    }));
  };

  const clearFilters = () => {
    setFilters({
      connectorTypes: [],
      powerRange: [7, 150],
      onlyAvailable: false,
      nearbyOnly: false,
    });
  };

  const activeFiltersCount = 
    filters.connectorTypes.length + 
    (filters.onlyAvailable ? 1 : 0) + 
    (filters.nearbyOnly ? 1 : 0) +
    (filters.powerRange[0] > 7 || filters.powerRange[1] < 150 ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Станции</h1>
          <p className="text-muted-foreground">
            {filteredStations.length} из {mockStations.length} станций
          </p>
        </div>
        {userRole === 'business' && (
          <Button onClick={() => navigate('/stations/add')}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить
          </Button>
        )}
      </div>

      {/* Поиск и фильтры */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию или адресу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Фильтр
              {activeFiltersCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-2xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Фильтр</SheetTitle>
              <SheetDescription>
                Настройте параметры поиска станций
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 py-6">
              {/* Тип коннектора */}
              <div className="space-y-3">
                <Label>Тип коннектора</Label>
                <div className="space-y-2">
                  {connectorTypes.map(({ type, label }) => (
                    <div key={type} className="flex items-center space-x-3">
                      <Checkbox
                        id={type}
                        checked={filters.connectorTypes.includes(type)}
                        onCheckedChange={() => toggleConnectorType(type)}
                      />
                      <Label htmlFor={type} className="flex items-center gap-2 font-normal">
                        <Zap className="h-4 w-4" />
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Мощность */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Мощность заряда</Label>
                  <span className="text-sm text-primary">
                    {filters.powerRange[0]}-{filters.powerRange[1]} кВт·ч
                  </span>
                </div>
                <Slider
                  value={filters.powerRange}
                  min={7}
                  max={150}
                  step={1}
                  onValueChange={(value) => setFilters(prev => ({
                    ...prev,
                    powerRange: value as [number, number]
                  }))}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>до 7 кВт·ч</span>
                  <span>до 22 кВт·ч</span>
                  <span>до 150 кВт·ч</span>
                </div>
              </div>

              {/* Переключатели */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="available">Рабочие станции</Label>
                  <Switch
                    id="available"
                    checked={filters.onlyAvailable}
                    onCheckedChange={(checked) => setFilters(prev => ({
                      ...prev,
                      onlyAvailable: checked
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="nearby">Станции рядом</Label>
                    <p className="text-sm text-muted-foreground">
                      Зарядные станции в радиусе 10 км
                    </p>
                  </div>
                  <Switch
                    id="nearby"
                    checked={filters.nearbyOnly}
                    onCheckedChange={(checked) => setFilters(prev => ({
                      ...prev,
                      nearbyOnly: checked
                    }))}
                  />
                </div>
              </div>
            </div>
            <SheetFooter className="flex-row gap-2">
              <Button variant="outline" onClick={clearFilters} className="flex-1">
                Очистить
              </Button>
              <Button className="flex-1">
                Применить
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Список станций */}
      <div className="space-y-3">
        {filteredStations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Станции не найдены</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Попробуйте изменить параметры поиска
              </p>
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Сбросить фильтры
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredStations.map((station) => (
            <Card
              key={station.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate(`/stations/${station.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                      station.status === 'available' ? 'bg-green-500/10' :
                      station.status === 'charging' ? 'bg-blue-500/10' : 'bg-gray-500/10'
                    )}>
                      <MapPin className={cn(
                        "h-6 w-6",
                        station.status === 'available' ? 'text-green-600' :
                        station.status === 'charging' ? 'text-blue-600' : 'text-gray-500'
                      )} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{station.name}</h3>
                      <p className="text-sm text-muted-foreground">{station.address}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {station.connectors.map((connector) => (
                          <Badge key={connector.id} variant="secondary" className="text-xs">
                            {connector.type} · {connector.powerKw} кВт
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={station.status} />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

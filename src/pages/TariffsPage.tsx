import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Banknote, Plus, Pencil, Trash2, Clock, Zap } from 'lucide-react';

interface SpecialCondition {
  id: string;
  timeFrom: string;
  timeTo: string;
  price: number;
}

interface Tariff {
  id: string;
  name: string;
  pricePerKwh: number;
  conditions: SpecialCondition[];
  maxTimeMin?: number;
  maxEnergyKwh?: number;
}

const MOCK_TARIFFS: Tariff[] = [
  {
    id: '1',
    name: 'Базовый',
    pricePerKwh: 20,
    conditions: [
      { id: 'c1', timeFrom: '23:00', timeTo: '07:00', price: 15 },
    ],
    maxTimeMin: 120,
  },
  {
    id: '2',
    name: 'Ночной',
    pricePerKwh: 12,
    conditions: [],
  },
];

const TARIFF_NAMES = [
  'Базовый',
  'Дневной',
  'Ночной',
  'Корпоративный',
];

const TIME_OPTIONS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
];

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [showMock, setShowMock] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formConditions, setFormConditions] = useState<SpecialCondition[]>([]);
  const [formMaxTime, setFormMaxTime] = useState('');
  const [formMaxEnergy, setFormMaxEnergy] = useState('');

  const displayTariffs = showMock ? MOCK_TARIFFS : tariffs;

  const handleToggleMock = (checked: boolean) => {
    setShowMock(checked);
    if (!checked) setTariffs([]);
  };

  const openCreateDialog = () => {
    setFormName('');
    setFormPrice('');
    setFormConditions([]);
    setFormMaxTime('');
    setFormMaxEnergy('');
    setDialogOpen(true);
  };

  const addCondition = () => {
    setFormConditions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), timeFrom: '23:00', timeTo: '07:00', price: 15 },
    ]);
  };

  const removeCondition = (id: string) => {
    setFormConditions((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCondition = (id: string, field: keyof SpecialCondition, value: string | number) => {
    setFormConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSave = () => {
    if (!formName || !formPrice) return;
    const newTariff: Tariff = {
      id: crypto.randomUUID(),
      name: formName,
      pricePerKwh: Number(formPrice),
      conditions: formConditions,
      maxTimeMin: formMaxTime ? Number(formMaxTime) : undefined,
      maxEnergyKwh: formMaxEnergy ? Number(formMaxEnergy) : undefined,
    };
    setTariffs((prev) => [...prev, newTariff]);
    setShowMock(false);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Тарифы</h1>
        <Button onClick={openCreateDialog} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Создать
        </Button>
      </div>

      {/* Dev toggle */}
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/50 px-4 py-2.5 text-sm">
        <Switch checked={showMock} onCheckedChange={handleToggleMock} />
        <span className="text-muted-foreground">Тестовые данные</span>
      </div>

      {/* Empty state */}
      {displayTariffs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Banknote className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold mb-1">У вас пока нет тарифов</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Создайте первый тариф, чтобы начать зарабатывать на зарядных станциях.
          </p>
          <Button onClick={openCreateDialog} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Создать тариф
          </Button>
        </div>
      )}

      {/* Tariff grid */}
      {displayTariffs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTariffs.map((tariff) => (
            <Card key={tariff.id} className="relative overflow-hidden">
              <CardContent className="p-5 space-y-4">
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-semibold">{tariff.name}</h3>
                  <div className="flex items-center gap-1 -mt-0.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight">{tariff.pricePerKwh}</span>
                  <span className="text-sm text-muted-foreground">руб / кВт·ч</span>
                </div>

                {/* Conditions */}
                <div className="text-sm text-muted-foreground space-y-1">
                  {tariff.conditions.length > 0 ? (
                    tariff.conditions.map((c) => (
                      <p key={c.id} className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        Спец. цена: {c.price} руб ({c.timeFrom} – {c.timeTo})
                      </p>
                    ))
                  ) : (
                    <p>Без дополнительных условий</p>
                  )}
                </div>

                {/* Limits */}
                {(tariff.maxTimeMin || tariff.maxEnergyKwh) && (
                  <div className="border-t pt-3 text-sm text-muted-foreground space-y-1">
                    {tariff.maxTimeMin && (
                      <p className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        Макс. время: {tariff.maxTimeMin} мин
                      </p>
                    )}
                    {tariff.maxEnergyKwh && (
                      <p className="flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 shrink-0" />
                        Макс. энергия: {tariff.maxEnergyKwh} кВт·ч
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create tariff dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать новый тариф</DialogTitle>
            <DialogDescription>Заполните параметры тарифа для зарядных станций.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Name select */}
            <div className="space-y-2">
              <Label>Название тарифа</Label>
              <Select value={formName} onValueChange={setFormName}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите название" />
                </SelectTrigger>
                <SelectContent>
                  {TARIFF_NAMES.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Base price */}
            <div className="space-y-2">
              <Label>Базовая стоимость (руб / кВт·ч)</Label>
              <Input
                type="number"
                placeholder="0"
                min={0}
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Действует всегда, если не заданы особые условия времени
              </p>
            </div>

            {/* Special conditions */}
            <div className="space-y-3">
              <Label>Специальные условия</Label>
              {formConditions.map((cond) => (
                <div
                  key={cond.id}
                  className="flex flex-wrap items-center gap-2 rounded-md bg-secondary p-3"
                >
                  <span className="text-sm text-muted-foreground shrink-0">Каждый день</span>
                  <Select
                    value={cond.timeFrom}
                    onValueChange={(v) => updateCondition(cond.id, 'timeFrom', v)}
                  >
                    <SelectTrigger className="w-[90px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">–</span>
                  <Select
                    value={cond.timeTo}
                    onValueChange={(v) => updateCondition(cond.id, 'timeTo', v)}
                  >
                    <SelectTrigger className="w-[90px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    className="w-20 h-8 text-xs"
                    placeholder="Цена"
                    min={0}
                    value={cond.price}
                    onChange={(e) => updateCondition(cond.id, 'price', Number(e.target.value))}
                  />
                  <span className="text-xs text-muted-foreground">руб</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 ml-auto text-muted-foreground hover:text-destructive"
                    onClick={() => removeCondition(cond.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addCondition}>
                <Plus className="h-3.5 w-3.5" />
                Добавить условие
              </Button>
            </div>

            {/* Session limits */}
            <div className="space-y-2">
              <Label>Ограничения сессии</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Макс. время (мин)</Label>
                  <Input
                    type="number"
                    placeholder="Без ограничений"
                    min={0}
                    value={formMaxTime}
                    onChange={(e) => setFormMaxTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Макс. энергия (кВт·ч)</Label>
                  <Input
                    type="number"
                    placeholder="Без ограничений"
                    min={0}
                    value={formMaxEnergy}
                    onChange={(e) => setFormMaxEnergy(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formName || !formPrice}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Сохранить тариф
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

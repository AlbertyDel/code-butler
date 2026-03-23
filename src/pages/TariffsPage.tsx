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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

const TIME_OPTIONS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
];

/** Parse "HH:00" to number 0-23 */
function timeToNum(t: string): number {
  return parseInt(t.split(':')[0], 10);
}

/** Check if two time ranges overlap (handles overnight ranges like 23:00-07:00) */
function rangesOverlap(a: SpecialCondition, b: SpecialCondition): boolean {
  const expand = (from: string, to: string): Set<number> => {
    const f = timeToNum(from);
    const t = timeToNum(to);
    const hours = new Set<number>();
    if (f < t) {
      for (let i = f; i < t; i++) hours.add(i);
    } else {
      for (let i = f; i < 24; i++) hours.add(i);
      for (let i = 0; i < t; i++) hours.add(i);
    }
    return hours;
  };
  const setA = expand(a.timeFrom, a.timeTo);
  const setB = expand(b.timeFrom, b.timeTo);
  for (const h of setA) {
    if (setB.has(h)) return true;
  }
  return false;
}

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [showMock, setShowMock] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState<Tariff | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Tariff | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formConditions, setFormConditions] = useState<SpecialCondition[]>([]);
  const [formMaxTime, setFormMaxTime] = useState('');
  const [formMaxEnergy, setFormMaxEnergy] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<{ name?: string; price?: string; conditions?: string }>({});

  const displayTariffs = showMock ? MOCK_TARIFFS : tariffs;

  const handleToggleMock = (checked: boolean) => {
    setShowMock(checked);
    if (!checked) setTariffs([]);
  };

  const openCreateDialog = () => {
    setEditingTariff(null);
    setFormName('');
    setFormPrice('');
    setFormConditions([]);
    setFormMaxTime('');
    setFormMaxEnergy('');
    setErrors({});
    setDialogOpen(true);
  };

  const openEditDialog = (tariff: Tariff) => {
    setEditingTariff(tariff);
    setFormName(tariff.name);
    setFormPrice(String(tariff.pricePerKwh));
    setFormConditions(tariff.conditions.map((c) => ({ ...c })));
    setFormMaxTime(tariff.maxTimeMin ? String(tariff.maxTimeMin) : '');
    setFormMaxEnergy(tariff.maxEnergyKwh ? String(tariff.maxEnergyKwh) : '');
    setErrors({});
    setDialogOpen(true);
  };

  const addCondition = () => {
    setFormConditions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), timeFrom: '', timeTo: '', price: 0 },
    ]);
  };

  const removeCondition = (id: string) => {
    setFormConditions((prev) => prev.filter((c) => c.id !== id));
    setErrors((prev) => ({ ...prev, conditions: undefined }));
  };

  const updateCondition = (id: string, field: keyof SpecialCondition, value: string | number) => {
    setFormConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const validateOverlap = (conditions: SpecialCondition[]): boolean => {
    for (let i = 0; i < conditions.length; i++) {
      for (let j = i + 1; j < conditions.length; j++) {
        if (rangesOverlap(conditions[i], conditions[j])) return true;
      }
    }
    return false;
  };

  const handleSave = () => {
    const newErrors: typeof errors = {};
    if (!formName.trim()) newErrors.name = 'Укажите название тарифа';
    if (!formPrice) newErrors.price = 'Укажите стоимость';
    if (formConditions.length >= 2 && validateOverlap(formConditions)) {
      newErrors.conditions = 'Временные интервалы условий не должны пересекаться.';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const tariffData = {
      name: formName.trim(),
      pricePerKwh: Number(formPrice),
      conditions: formConditions,
      maxTimeMin: formMaxTime ? Number(formMaxTime) : undefined,
      maxEnergyKwh: formMaxEnergy ? Number(formMaxEnergy) : undefined,
    };

    if (editingTariff) {
      setTariffs((prev) =>
        prev.map((t) => (t.id === editingTariff.id ? { ...t, ...tariffData } : t))
      );
    } else {
      setTariffs((prev) => [...prev, { id: crypto.randomUUID(), ...tariffData }]);
    }
    setShowMock(false);
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setTariffs((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    setShowMock(false);
    setDeleteTarget(null);
  };

  const isEditing = !!editingTariff;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Тарифы</h1>
        {displayTariffs.length > 0 && (
          <Button onClick={openCreateDialog} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Создать
          </Button>
        )}
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
            <Card key={tariff.id} className="relative overflow-hidden animate-fade-in transition-all duration-300">
              <CardContent className="p-5 space-y-4">
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-semibold">{tariff.name}</h3>
                  <div className="flex items-center gap-1 -mt-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => openEditDialog(tariff)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(tariff)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight">{tariff.pricePerKwh}</span>
                  <span className="text-sm text-muted-foreground">₽ / кВт·ч</span>
                </div>

                {/* Conditions */}
                <div className="text-sm text-muted-foreground space-y-1">
                  {tariff.conditions.length > 0 ? (
                    tariff.conditions.map((c) => (
                      <p key={c.id} className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        {c.price} ₽ с {c.timeFrom} до {c.timeTo}
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
                        Лимит времени: {tariff.maxTimeMin} минут
                      </p>
                    )}
                    {tariff.maxEnergyKwh && (
                      <p className="flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 shrink-0" />
                        Лимит энергии: {tariff.maxEnergyKwh} кВт·ч
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit tariff dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex flex-col max-h-[90dvh] w-[calc(100vw-2rem)] sm:max-w-lg mx-auto rounded-xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Редактировать тариф' : 'Создать новый тариф'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Измените параметры тарифа и сохраните.'
                : 'Заполните параметры тарифа для зарядных станций.'}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto px-1 -mx-1 pr-4 -mr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="space-y-5 py-2">
              {/* Name input */}
              <div className="space-y-2">
                <Label>
                  Название тарифа <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Например: Подземный паркинг или Гостевой"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={errors.name ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-primary'}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              {/* Base price */}
              <div className="space-y-2">
                <Label>
                  Базовая цена (кВт·ч) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="Например, 20"
                    min={0}
                    value={formPrice}
                    onChange={(e) => {
                      setFormPrice(e.target.value);
                      if (errors.price) setErrors((prev) => ({ ...prev, price: undefined }));
                    }}
                    className={`pr-8 ${errors.price ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-primary'}`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">₽</span>
                </div>
                {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
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
                      value={cond.timeFrom || undefined}
                      onValueChange={(v) => updateCondition(cond.id, 'timeFrom', v)}
                    >
                      <SelectTrigger className="w-[90px] h-8 text-xs">
                        <SelectValue placeholder="С" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">–</span>
                     <Select
                      value={cond.timeTo || undefined}
                      onValueChange={(v) => updateCondition(cond.id, 'timeTo', v)}
                    >
                      <SelectTrigger className="w-[90px] h-8 text-xs">
                        <SelectValue placeholder="До" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <Input
                        type="number"
                        className="w-24 h-8 text-xs pr-6 focus-visible:ring-primary"
                        placeholder="Цена"
                        min={0}
                        value={cond.price || ''}
                        onChange={(e) => updateCondition(cond.id, 'price', Number(e.target.value))}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">₽</span>
                    </div>
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
                {errors.conditions && (
                  <p className="text-xs text-destructive">{errors.conditions}</p>
                )}
              </div>
              <Button
                variant="outline"
                className="w-full border-dashed border-2 text-muted-foreground hover:text-primary hover:border-primary hover:bg-accent/50 mt-4"
                onClick={addCondition}
              >
                Добавить
              </Button>

              {/* Session limits */}
              <div className="space-y-2">
                <Label>Ограничения сессии</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Лимит времени (минуты)</Label>
                    <Input
                      type="number"
                      placeholder="Без ограничений"
                      min={0}
                      value={formMaxTime}
                      onChange={(e) => setFormMaxTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Лимит энергии (кВт·ч)</Label>
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isEditing ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы собираетесь удалить тариф: {deleteTarget?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Действие отменить нельзя. Тариф будет безвозвратно удален и отвязан от всех станций.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

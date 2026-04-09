import { useState, useEffect, useSyncExternalStore } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PageSkeleton } from '@/components/PageSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Banknote, Pencil, Trash2, Clock, Zap, Star } from 'lucide-react';
import { getSharedStations, subscribeToStations } from '@/pages/StationsPage';

interface SpecialCondition {
  id: string;
  timeFrom: string;
  timeTo: string;
  price: number;
}

export interface TariffLocal {
  id: string;
  name: string;
  pricePerKwh: number;
  conditions: SpecialCondition[];
  maxTimeMin?: number;
  maxEnergyKwh?: number;
  isDefault?: boolean;
}

const MOCK_TARIFFS: TariffLocal[] = [
  {
    id: '1',
    name: 'Базовый',
    pricePerKwh: 20,
    conditions: [
      { id: 'c1', timeFrom: '23:00', timeTo: '07:00', price: 15 },
    ],
    maxTimeMin: 120,
    maxEnergyKwh: 50,
    isDefault: true,
  },
  {
    id: '2',
    name: 'Ночной',
    pricePerKwh: 12,
    conditions: [],
    maxTimeMin: 60,
    maxEnergyKwh: 30,
    isDefault: false,
  },
];

const TIME_OPTIONS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
];

function timeToNum(t: string): number {
  return parseInt(t.split(':')[0], 10);
}

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

function isConditionComplete(c: SpecialCondition): boolean {
  return !!c.timeFrom && !!c.timeTo && c.price > 0;
}

// Shared tariff state for cross-page access
let _sharedTariffs: TariffLocal[] = [];
let _sharedListeners: Array<() => void> = [];

export function getSharedTariffs(): TariffLocal[] {
  return _sharedTariffs;
}

export function subscribeToTariffs(listener: () => void): () => void {
  _sharedListeners.push(listener);
  return () => {
    _sharedListeners = _sharedListeners.filter(l => l !== listener);
  };
}

function setSharedTariffs(tariffs: TariffLocal[]) {
  _sharedTariffs = tariffs;
  _sharedListeners.forEach(l => l());
}

export default function TariffsPage() {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [tariffs, setTariffs] = useState<TariffLocal[]>([]);
  const [showMock, setShowMock] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState<TariffLocal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TariffLocal | null>(null);

  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formConditions, setFormConditions] = useState<SpecialCondition[]>([]);
  const [formMaxTime, setFormMaxTime] = useState('');
  const [formMaxEnergy, setFormMaxEnergy] = useState('');

  const [errors, setErrors] = useState<{ name?: string; price?: string; conditions?: string; maxTime?: string; maxEnergy?: string }>({});

  const displayTariffs = showMock ? MOCK_TARIFFS : tariffs;

  // Sync shared tariffs for station page access
  useEffect(() => {
    setSharedTariffs(displayTariffs);
  }, [displayTariffs]);

  // Access shared stations for delete protection
  const sharedStations = useSyncExternalStore(subscribeToStations, getSharedStations);

  const getStationsUsingTariff = (tariffId: string) => {
    return sharedStations.filter(s => s.tariffId === tariffId);
  };

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

  const openEditDialog = (tariff: TariffLocal) => {
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

  const handleSetDefault = (tariffId: string) => {
    if (showMock) {
      // Allow setting default even in mock mode for testing
      const updated = MOCK_TARIFFS.map(t => ({ ...t, isDefault: t.id === tariffId }));
      // We can't mutate MOCK_TARIFFS, so switch to real state with a copy
      setTariffs(updated);
      setShowMock(false);
      return;
    }
    setTariffs(prev => prev.map(t => ({ ...t, isDefault: t.id === tariffId })));
  };

  const handleSave = () => {
    const newErrors: typeof errors = {};
    if (!formName.trim()) newErrors.name = 'Укажите название тарифа';
    if (!formPrice) newErrors.price = 'Укажите стоимость';

    const maxTimeNum = Number(formMaxTime);
    if (!formMaxTime) {
      newErrors.maxTime = 'Укажите лимит времени';
    } else if (!Number.isFinite(maxTimeNum) || maxTimeNum < 5) {
      newErrors.maxTime = 'Минимум 5 минут';
    } else if (maxTimeNum > 600) {
      newErrors.maxTime = 'Максимум 600 минут';
    }

    const maxEnergyNum = Number(formMaxEnergy);
    if (!formMaxEnergy) {
      newErrors.maxEnergy = 'Укажите лимит энергии';
    } else if (!Number.isFinite(maxEnergyNum) || maxEnergyNum < 5) {
      newErrors.maxEnergy = 'Минимум 5 кВт·ч';
    } else if (maxEnergyNum > 200) {
      newErrors.maxEnergy = 'Максимум 200 кВт·ч';
    }

    const completeConditions = formConditions.filter(isConditionComplete);

    if (completeConditions.length >= 2 && validateOverlap(completeConditions)) {
      newErrors.conditions = 'Временные интервалы условий не должны пересекаться.';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const tariffData = {
      name: formName.trim(),
      pricePerKwh: Number(formPrice),
      conditions: completeConditions,
      maxTimeMin: maxTimeNum,
      maxEnergyKwh: maxEnergyNum,
    };

    if (editingTariff) {
      setTariffs((prev) =>
        prev.map((t) => (t.id === editingTariff.id ? { ...t, ...tariffData } : t))
      );
    } else {
      // First tariff automatically becomes default
      const isFirst = tariffs.length === 0;
      setTariffs((prev) => [...prev, { id: crypto.randomUUID(), ...tariffData, isDefault: isFirst }]);
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
  const isDeleteTargetDefault = deleteTarget?.isDefault === true;
  const deleteTargetStations = deleteTarget ? getStationsUsingTariff(deleteTarget.id) : [];
  const isDeleteTargetInUse = deleteTargetStations.length > 0;
  const canDelete = !isDeleteTargetDefault && !isDeleteTargetInUse;

  if (isPageLoading) return <PageSkeleton cards={4} />;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Тарифы</h1>
        {displayTariffs.length > 0 && (
          <Button onClick={openCreateDialog} className="bg-primary text-primary-foreground hover:bg-primary/90">
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
            Создать
          </Button>
        </div>
      )}

      {/* Explanation text */}
      {displayTariffs.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Тариф по умолчанию применяется ко всем станциям, у которых не выбран другой тариф.
        </p>
      )}

      {/* Tariff grid */}
      {displayTariffs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTariffs.map((tariff) => {
            const validConditions = tariff.conditions.filter(isConditionComplete);
            return (
              <Card key={tariff.id} className={cn(
                "relative overflow-hidden animate-fade-in transition-all duration-300",
                tariff.isDefault && "border-primary/30 bg-primary/[0.03]"
              )}>
                <CardContent className="p-5 space-y-4">
                  {/* Header: actions top-right, title + badge stacked */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <h3 className="text-base font-semibold break-words">{tariff.name}</h3>
                      {tariff.isDefault && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Star className="h-3 w-3" />
                          По умолчанию
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
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

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight">{tariff.pricePerKwh}</span>
                    <span className="text-sm text-muted-foreground">₽ / кВт·ч</span>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    {validConditions.length > 0 ? (
                      validConditions.map((c) => (
                        <p key={c.id} className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {c.price} ₽ с {c.timeFrom} до {c.timeTo}
                        </p>
                      ))
                    ) : (
                      <p>Без дополнительных условий</p>
                    )}
                  </div>

                  <div className="border-t pt-3 text-sm text-muted-foreground space-y-1">
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      Лимит времени: {tariff.maxTimeMin} мин
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 shrink-0" />
                      Лимит энергии: {tariff.maxEnergyKwh} кВт·ч
                    </p>
                  </div>

                  {!tariff.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5"
                      onClick={() => handleSetDefault(tariff.id)}
                    >
                      <Star className="h-3.5 w-3.5" />
                      Сделать основным
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit tariff dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="w-[94vw] max-w-[450px] p-0 overflow-hidden flex flex-col max-h-[85dvh] rounded-2xl border-none fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-[100]"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle>{isEditing ? 'Редактировать тариф' : 'Создать новый тариф'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Измените параметры тарифа и сохраните.'
                : 'Заполните параметры тарифа для зарядных станций.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-5">
              {/* Name input */}
              <div className="space-y-2">
                <Label>
                  Название тарифа <span className="text-destructive">*</span>
                </Label>
                <Input
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
                    className="rounded-md bg-secondary p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Каждый день</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeCondition(cond.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={cond.timeFrom || undefined}
                        onValueChange={(v) => updateCondition(cond.id, 'timeFrom', v)}
                      >
                        <SelectTrigger className="w-[90px] h-8 text-xs">
                          <SelectValue placeholder="С" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="z-[200]">
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
                        <SelectContent position="popper" className="z-[200]">
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
                    </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Лимит времени <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="от 5 до 600"
                        min={5}
                        max={600}
                        value={formMaxTime}
                        onChange={(e) => {
                          setFormMaxTime(e.target.value);
                          if (errors.maxTime) setErrors((prev) => ({ ...prev, maxTime: undefined }));
                        }}
                        className={`pr-14 ${errors.maxTime ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-primary'}`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">мин.</span>
                    </div>
                    {errors.maxTime && <p className="text-xs text-destructive">{errors.maxTime}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Лимит энергии <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="от 5 до 200"
                        min={5}
                        max={200}
                        value={formMaxEnergy}
                        onChange={(e) => {
                          setFormMaxEnergy(e.target.value);
                          if (errors.maxEnergy) setErrors((prev) => ({ ...prev, maxEnergy: undefined }));
                        }}
                        className={`pr-16 ${errors.maxEnergy ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-primary'}`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">кВт·ч</span>
                    </div>
                    {errors.maxEnergy && <p className="text-xs text-destructive">{errors.maxEnergy}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full p-5 border-t bg-background">
            <Button variant="outline" className="w-full sm:w-auto h-11 sm:h-10" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              className="w-full sm:w-auto h-11 sm:h-10 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isEditing ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isDeleteTargetDefault
                ? 'Нельзя удалить тариф по умолчанию'
                : isDeleteTargetInUse
                  ? `Нельзя удалить тариф «${deleteTarget?.name}»`
                  : `Удалить тариф «${deleteTarget?.name}»?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isDeleteTargetDefault
                ? 'Сначала назначьте другой тариф по умолчанию.'
                : isDeleteTargetInUse
                  ? `Тариф используется ${deleteTargetStations.length === 1 ? 'станцией' : 'станциями'} (${deleteTargetStations.length}). Переведите их на другой тариф или верните на тариф по умолчанию.`
                  : 'Тариф будет удален из списка.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="w-full sm:w-auto h-11 sm:h-10">
              {canDelete ? 'Отмена' : 'Понятно'}
            </AlertDialogCancel>
            {canDelete && (
              <AlertDialogAction
                onClick={handleDelete}
                className="w-full sm:w-auto h-11 sm:h-10 font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Удалить
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

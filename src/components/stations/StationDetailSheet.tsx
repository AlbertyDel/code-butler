import { memo, useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getActiveErrors } from '@/lib/station-errors';
import type { Station, ChargerStatus } from '@/types';

interface StationDetailSheetProps {
  station: Station | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: 'overview' | 'monitoring' | 'performance';
}

const statusConfig: Record<ChargerStatus, { label: string; className: string }> = {
  available: { label: 'Работает', className: 'status-available' },
  charging: { label: 'Заряжает', className: 'status-charging' },
  offline: { label: 'Не работает', className: 'status-offline' },
  maintenance: { label: 'Не работает', className: 'status-offline' },
};

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-4">
        <h4 className="text-sm font-semibold mb-2">{title}</h4>
        <Separator className="mb-1" />
        {children}
      </CardContent>
    </Card>
  );
}

function OverviewTab({ station }: { station: Station }) {
  const totalPower = station.connectors.reduce((sum, c) => sum + c.powerKw, 0);
  const { label, className } = statusConfig[station.status];

  return (
    <div className="space-y-4">
      <SectionCard title="Основная информация">
        <InfoRow label="Название" value={station.name} />
        <InfoRow label="ID" value={station.id.replace('st-', 'CHG-100')} />
        <InfoRow label="Адрес" value={station.address} />
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-muted-foreground">Статус</span>
          <Badge variant="outline" className={cn('rounded-full font-medium', className)}>
            {label}
          </Badge>
        </div>
        <InfoRow label="Мощность" value={`${totalPower} кВт`} />
        <InfoRow label="Кол-во портов" value={station.connectors.length} />
      </SectionCard>

      <SectionCard title="Статистика сегодня">
        <InfoRow label="Энергия" value={`${station.stats.energyTodayKwh} кВт·ч`} />
        <InfoRow label="Сессии" value={station.stats.sessionsToday} />
      </SectionCard>
    </div>
  );
}

function MonitoringTab({ station }: { station: Station }) {
  const { electrical, temperature } = station;
  const activeErrors = getActiveErrors(station.errorBits);

  return (
    <div className="space-y-4">
      {/* Errors — only when present */}
      {activeErrors.length > 0 && (
        <Card className="rounded-xl border-destructive/30">
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold mb-2">Ошибки</h4>
            <Separator className="mb-2" />
            <Accordion type="multiple" className="w-full">
              {activeErrors.map((err) => (
                <AccordionItem key={err.bit} value={`err-${err.bit}`} className="border-b-0">
                  <AccordionTrigger className="py-2 text-sm hover:no-underline">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                      <span className="text-left">{err.label}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2 pl-6 text-xs text-muted-foreground">
                    {err.description}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      <SectionCard title="Электрические параметры">
        <InfoRow label="Напряжение Фаза 1" value={`${electrical.voltagePhase1} В`} />
        <InfoRow label="Напряжение Фаза 2" value={`${electrical.voltagePhase2} В`} />
        <InfoRow label="Напряжение Фаза 3" value={`${electrical.voltagePhase3} В`} />
        <InfoRow label="Кол-во фаз" value={electrical.phases} />
        <InfoRow label="Макс. ток порта" value={`${electrical.maxCurrentA} А`} />
        <InfoRow label="Состояние реле" value={electrical.relayState === 'on' ? 'Вкл' : 'Выкл'} />
      </SectionCard>

      <SectionCard title="Температурные параметры">
        <InfoRow label="Темп. контактов на входе" value={`${temperature.inputContacts} °C`} />
        <InfoRow label="Темп. порта 0" value={`${temperature.port0} °C`} />
        <InfoRow label="Темп. порта 1" value={`${temperature.port1} °C`} />
        <InfoRow label="Темп. внутри ЗУ" value={`${temperature.internal} °C`} />
      </SectionCard>
    </div>
  );
}

function PerformanceTab({ station }: { station: Station }) {
  const { stats } = station;

  return (
    <div className="space-y-4">
      <SectionCard title="Общие показатели">
        <InfoRow label="Сессий всего" value={stats.totalSessions.toLocaleString('ru-RU')} />
        <InfoRow label="Энергии всего" value={`${stats.totalEnergyKwh.toLocaleString('ru-RU')} кВт·ч`} />
        <InfoRow label="Часов работы всего" value={stats.totalHours.toLocaleString('ru-RU')} />
      </SectionCard>
    </div>
  );
}

export const StationDetailSheet = memo(function StationDetailSheet({
  station,
  open,
  onOpenChange,
}: StationDetailSheetProps) {
  if (!station) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg">{station.name} • Детали</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">Обзор</TabsTrigger>
            <TabsTrigger value="monitoring" className="flex-1">Мониторинг</TabsTrigger>
            <TabsTrigger value="performance" className="flex-1">Производительность</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab station={station} />
          </TabsContent>
          <TabsContent value="monitoring">
            <MonitoringTab station={station} />
          </TabsContent>
          <TabsContent value="performance">
            <PerformanceTab station={station} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
});

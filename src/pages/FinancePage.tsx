import { useState, useCallback, useMemo, useEffect } from 'react';
import { PageSkeleton } from '@/components/PageSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MockToggle } from '@/components/MockToggle';
import { useMockToggle } from '@/hooks/useMockToggle';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious, PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  Wallet, Lock, Hourglass, Zap, ArrowDownToLine, Download, CalendarIcon, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useBusinessState } from '@/contexts/BusinessStateContext';
import { format, isAfter, isBefore, startOfDay, endOfDay, setMonth, setYear } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// --- Types ---

type TransactionType = 'income' | 'withdrawal';
type IncomeStatus = 'credited';
type WithdrawalStatus = 'processing' | 'done' | 'error';
type FilterType = 'all' | 'income' | 'withdrawal';

interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  status: IncomeStatus | WithdrawalStatus;
  stationName?: string;
}

// --- Mock data ---

const mockTransactions: Transaction[] = [
  { id: 't-1', date: '2025-03-22T14:30:00Z', type: 'income', amount: 490, status: 'credited', stationName: 'ЭЗС Москва-Сити' },
  { id: 't-2', date: '2025-03-21T09:15:00Z', type: 'income', amount: 750, status: 'credited', stationName: 'ЭЗС ВДНХ' },
  { id: 't-3', date: '2025-03-20T18:00:00Z', type: 'withdrawal', amount: 5000, status: 'processing' },
  { id: 't-4', date: '2025-03-19T11:45:00Z', type: 'income', amount: 392, status: 'credited', stationName: 'ЭЗС ТЦ Европейский' },
  { id: 't-5', date: '2025-03-18T20:10:00Z', type: 'withdrawal', amount: 3000, status: 'done' },
  { id: 't-6', date: '2025-03-17T08:30:00Z', type: 'income', amount: 168, status: 'credited', stationName: 'ЭЗС Арбат' },
  { id: 't-7', date: '2025-03-16T15:00:00Z', type: 'withdrawal', amount: 2000, status: 'error' },
  { id: 't-8', date: '2025-03-15T12:00:00Z', type: 'income', amount: 620, status: 'credited', stationName: 'ЭЗС Парк Горького' },
  { id: 't-9', date: '2025-03-14T10:20:00Z', type: 'income', amount: 310, status: 'credited', stationName: 'ЭЗС Сокольники' },
  { id: 't-10', date: '2025-03-13T16:45:00Z', type: 'withdrawal', amount: 1500, status: 'done' },
  { id: 't-11', date: '2025-03-12T07:30:00Z', type: 'income', amount: 880, status: 'credited', stationName: 'ЭЗС Химки' },
  { id: 't-12', date: '2025-03-11T19:00:00Z', type: 'income', amount: 245, status: 'credited', stationName: 'ЭЗС Тушино' },
  { id: 't-13', date: '2025-03-10T13:15:00Z', type: 'withdrawal', amount: 4000, status: 'done' },
  { id: 't-14', date: '2025-03-09T08:00:00Z', type: 'income', amount: 530, status: 'credited', stationName: 'ЭЗС Измайлово' },
  { id: 't-15', date: '2025-03-08T22:30:00Z', type: 'income', amount: 190, status: 'credited', stationName: 'ЭЗС Бутово' },
];

type MockState = 'empty' | 'filled_no_processing' | 'filled_with_processing';

// Balance = total money not yet paid out
// Processing = part of balance with active withdrawal request
// Available = Balance - Processing
const MOCK_SCENARIOS: Record<MockState, { balance: number; processing: number; transactions: Transaction[] }> = {
  empty: { balance: 0, processing: 0, transactions: [] },
  filled_no_processing: {
    balance: 18385,
    processing: 0,
    transactions: mockTransactions.filter(t => t.status !== 'processing'),
  },
  filled_with_processing: {
    balance: 18385,
    processing: 5000,
    transactions: mockTransactions,
  },
};

const ITEMS_PER_PAGE = 10;

const BANKS = [
  'Сбербанк', 'Тинькофф', 'Альфа-Банк', 'ВТБ', 'Газпромбанк',
  'Райффайзен', 'Россельхозбанк', 'Открытие', 'Совкомбанк', 'Промсвязьбанк',
];

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

// --- Helpers ---

function formatPhone(digits: string): string {
  const d = digits.slice(0, 11);
  let result = '+7';
  if (d.length > 1) result += ' ' + d.slice(1, 4);
  if (d.length > 4) result += ' ' + d.slice(4, 7);
  if (d.length > 7) result += ' ' + d.slice(7, 9);
  if (d.length > 9) result += ' ' + d.slice(9, 11);
  return result;
}

function formatCard(digits: string): string {
  return digits.slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function cleanDigits(value: string): string {
  return value.replace(/\D/g, '');
}

type StatusStyle = { label: string; className: string };

function getStatusDisplay(t: Transaction): StatusStyle {
  const base = 'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium leading-4 whitespace-nowrap';
  if (t.type === 'income') {
    return { label: 'Зачислено', className: `${base} bg-emerald-500/10 text-emerald-600 border-emerald-500/20` };
  }
  switch (t.status as WithdrawalStatus) {
    case 'processing': return { label: 'В обработке', className: `${base} bg-amber-500/10 text-amber-600 border-amber-500/20` };
    case 'done': return { label: 'Выполнено', className: `${base} bg-emerald-500/10 text-emerald-600 border-emerald-500/20` };
    case 'error': return { label: 'Ошибка', className: `${base} bg-destructive/10 text-destructive border-destructive/20` };
    default: return { label: '', className: '' };
  }
}

function fmtMoney(n: number) {
  return n.toLocaleString('ru-RU');
}

// --- Component ---

export default function FinancePage() {
  const { businessState } = useBusinessState();
  const [showMock, setShowMock] = useMockToggle('finance_mock');
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [mockState, setMockState] = useState<MockState>('filled_with_processing');

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const hasMockData = showMock;
  const scenario = hasMockData ? MOCK_SCENARIOS[mockState] : null;
  const transactions = scenario?.transactions ?? [];
  const balance = scenario?.balance ?? 0;
  const processing = scenario?.processing ?? 0;
  const available = balance - processing;

  const isEmpty = !hasMockData ? true : mockState === 'empty';
  const hasData = hasMockData && mockState !== 'empty';

  const filtered = useMemo(() => {
    let result = transactions;
    if (filter !== 'all') result = result.filter((t) => t.type === filter);
    if (dateFrom) result = result.filter((t) => !isBefore(new Date(t.date), startOfDay(dateFrom)));
    if (dateTo) result = result.filter((t) => !isAfter(new Date(t.date), endOfDay(dateTo)));
    return result;
  }, [transactions, filter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [filter, dateFrom, dateTo]);

  const handleDownloadCsv = useCallback(() => {
    const header = 'Дата,Описание,Сумма,Статус\n';
    const rows = filtered.map((t) => {
      const date = format(new Date(t.date), 'dd.MM.yyyy HH:mm');
      const desc = t.type === 'income' ? `Зарядка: ${t.stationName}` : 'Вывод средств';
      const amount = t.type === 'income' ? `+${t.amount}` : `-${t.amount}`;
      return `${date},"${desc}",${amount},${getStatusDisplay(t).label}`;
    }).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const getPageNumbers = useCallback(() => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  if (isPageLoading) return <PageSkeleton cards={4} />;

  const isPending = businessState === 'pending';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Mock controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <MockToggle checked={showMock} onCheckedChange={setShowMock} />
        {showMock && (
          <Select value={mockState} onValueChange={(v) => setMockState(v as MockState)}>
            <SelectTrigger className="w-full sm:w-[260px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="empty">Пустое состояние</SelectItem>
              <SelectItem value="filled_no_processing">Баланс есть, вывод = 0</SelectItem>
              <SelectItem value="filled_with_processing">Баланс + в обработке</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Content */}
      {isPending && !hasMockData ? (
        <EmptyPending />
      ) : isEmpty && !hasData ? (
        <EmptyNoData />
      ) : (
        <>
          {/* Summary Block */}
          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="space-y-4">
                {/* Primary */}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Доступно к выводу</p>
                  <p className="text-3xl sm:text-4xl font-bold tracking-tight">
                    {fmtMoney(available)} ₽
                  </p>
                </div>
                {available > 0 && (
                  <Button onClick={() => setWithdrawOpen(true)} size="sm">
                    Запросить вывод
                  </Button>
                )}
                {/* Secondary row */}
                <div className="flex items-center gap-6 pt-2 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Баланс</p>
                    <p className="text-base font-semibold">{fmtMoney(balance)} ₽</p>
                  </div>
                  {processing > 0 && (
                    <div>
                      <div className="flex items-center gap-1">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">В обработке</p>
                      </div>
                      <p className="text-base font-semibold text-muted-foreground">
                        {fmtMoney(processing)} ₽
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions */}
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">Пока нет завершённых операций</p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-4 sm:p-5 space-y-4">
                {/* Toolbar */}
                <div className="flex flex-col gap-3">
                  {/* Desktop */}
                  <div className="hidden md:flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FilterTabs filter={filter} onChange={setFilter} />
                      <PeriodPicker
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        onChangeFrom={setDateFrom}
                        onChangeTo={setDateTo}
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownloadCsv}>
                      <Download className="h-4 w-4 mr-1.5" />
                      Выгрузить
                    </Button>
                  </div>

                  {/* Tablet */}
                  <div className="hidden sm:flex md:hidden flex-wrap items-center gap-2">
                    <FilterTabs filter={filter} onChange={setFilter} />
                    <PeriodPicker
                      dateFrom={dateFrom}
                      dateTo={dateTo}
                      onChangeFrom={setDateFrom}
                      onChangeTo={setDateTo}
                    />
                    <Button variant="outline" size="sm" onClick={handleDownloadCsv} className="ml-auto">
                      <Download className="h-4 w-4 mr-1.5" />
                      Выгрузить
                    </Button>
                  </div>

                  {/* Mobile */}
                  <div className="flex flex-col gap-2 sm:hidden">
                    <FilterTabs filter={filter} onChange={setFilter} />
                    <PeriodPicker
                      dateFrom={dateFrom}
                      dateTo={dateTo}
                      onChangeFrom={setDateFrom}
                      onChangeTo={setDateTo}
                    />
                    <Button variant="outline" size="sm" className="w-full" onClick={handleDownloadCsv}>
                      <Download className="h-4 w-4 mr-1.5" />
                      Выгрузить
                    </Button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto -mx-4 sm:-mx-5">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4 sm:pl-5">Дата</TableHead>
                        <TableHead>Описание</TableHead>
                        <TableHead className="text-right">Сумма</TableHead>
                        <TableHead className="text-right pr-4 sm:pr-5">Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            Нет операций по выбранным фильтрам
                          </TableCell>
                        </TableRow>
                      ) : paginated.map((t) => {
                        const st = getStatusDisplay(t);
                        return (
                          <TableRow key={t.id}>
                            <TableCell className="pl-4 sm:pl-5 whitespace-nowrap text-muted-foreground">
                              {format(new Date(t.date), 'dd.MM.yyyy, HH:mm')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {t.type === 'income' ? (
                                  <Zap className="h-4 w-4 text-primary shrink-0" />
                                ) : (
                                  <ArrowDownToLine className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                                <span className="truncate">
                                  {t.type === 'income' ? `Зарядка: ${t.stationName}` : 'Вывод средств'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className={cn(
                              'text-right font-medium whitespace-nowrap',
                              t.type === 'income' && 'text-emerald-600'
                            )}>
                              {t.type === 'income' ? '+' : '−'}{t.amount.toLocaleString('ru-RU')} ₽
                            </TableCell>
                            <TableCell className="text-right pr-4 sm:pr-5">
                              <span className={st.className}>
                                {st.label}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {getPageNumbers().map((page, i) =>
                        page === 'ellipsis' ? (
                          <PaginationItem key={`e-${i}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={page}>
                            <PaginationLink
                              isActive={currentPage === page}
                              onClick={() => setCurrentPage(page)}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <WithdrawDialog open={withdrawOpen} onOpenChange={setWithdrawOpen} />
    </div>
  );
}

// --- Filter Tabs ---

function FilterTabs({ filter, onChange }: { filter: FilterType; onChange: (f: FilterType) => void }) {
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {(['all', 'income', 'withdrawal'] as FilterType[]).map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={cn(
            'px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap',
            filter === f
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {f === 'all' ? 'Все' : f === 'income' ? 'Пополнения' : 'Списания'}
        </button>
      ))}
    </div>
  );
}

// --- Grouped Period Picker ---

function PeriodPicker({
  dateFrom,
  dateTo,
  onChangeFrom,
  onChangeTo,
}: {
  dateFrom?: Date;
  dateTo?: Date;
  onChangeFrom: (d: Date | undefined) => void;
  onChangeTo: (d: Date | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [calMonth, setCalMonth] = useState<Date>(new Date());
  const [selectingField, setSelectingField] = useState<'from' | 'to'>('from');
  const [showMonthSelect, setShowMonthSelect] = useState(false);

  const handleSelect = (d: Date | undefined) => {
    if (!d) return;
    if (selectingField === 'from') {
      onChangeFrom(d);
      if (dateTo && isAfter(d, dateTo)) onChangeTo(undefined);
      setSelectingField('to');
    } else {
      if (dateFrom && isBefore(d, dateFrom)) {
        onChangeFrom(d);
      } else {
        onChangeTo(d);
      }
    }
  };

  const handleReset = () => {
    onChangeFrom(undefined);
    onChangeTo(undefined);
    setSelectingField('from');
  };

  const handleApply = () => {
    setOpen(false);
  };

  const currentMonth = calMonth.getMonth();
  const currentYear = calMonth.getFullYear();
  const yearRange = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center h-9 rounded-md border border-input bg-background text-sm transition-colors hover:bg-accent/50',
            'w-full sm:w-auto'
          )}
        >
          <span className={cn(
            'flex items-center gap-1.5 px-3 h-full',
            selectingField === 'from' && open && 'bg-accent/50',
            !dateFrom && 'text-muted-foreground',
          )}>
            <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
            {dateFrom ? format(dateFrom, 'dd.MM.yyyy') : 'От'}
          </span>
          <span className="w-px h-4 bg-border shrink-0" />
          <span className={cn(
            'flex items-center gap-1.5 px-3 h-full',
            selectingField === 'to' && open && 'bg-accent/50',
            !dateTo && 'text-muted-foreground',
          )}>
            {dateTo ? format(dateTo, 'dd.MM.yyyy') : 'До'}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
      >
        <div className="p-3 pointer-events-auto">
          {/* Month/Year header */}
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCalMonth(prev => setMonth(prev, prev.getMonth() - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button
              onClick={() => setShowMonthSelect(!showMonthSelect)}
              className="text-sm font-medium hover:underline px-2"
            >
              {MONTHS_RU[currentMonth]} {currentYear}
            </button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCalMonth(prev => setMonth(prev, prev.getMonth() + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {showMonthSelect ? (
            <div className="space-y-3">
              {/* Year */}
              <div className="flex flex-wrap gap-1 justify-center">
                {yearRange.map(y => (
                  <button
                    key={y}
                    onClick={() => { setCalMonth(setYear(calMonth, y)); }}
                    className={cn(
                      'px-2 py-1 text-xs rounded-md transition-colors',
                      y === currentYear ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
              {/* Months */}
              <div className="grid grid-cols-3 gap-1">
                {MONTHS_RU.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => { setCalMonth(setMonth(calMonth, i)); setShowMonthSelect(false); }}
                    className={cn(
                      'px-2 py-1.5 text-xs rounded-md transition-colors',
                      i === currentMonth ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <Calendar
                mode="single"
                selected={selectingField === 'from' ? dateFrom : dateTo}
                onSelect={handleSelect}
                month={calMonth}
                onMonthChange={setCalMonth}
                locale={ru}
                className="p-0 pointer-events-auto"
                classNames={{
                  caption: 'hidden',
                  nav: 'hidden',
                }}
                modifiers={{
                  range_start: dateFrom ? [dateFrom] : [],
                  range_end: dateTo ? [dateTo] : [],
                  range_middle: dateFrom && dateTo ? {
                    after: dateFrom,
                    before: dateTo,
                  } : undefined,
                }}
                modifiersClassNames={{
                  range_start: 'bg-primary text-primary-foreground rounded-l-md',
                  range_end: 'bg-primary text-primary-foreground rounded-r-md',
                  range_middle: 'bg-accent text-accent-foreground rounded-none',
                }}
              />
              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={!dateFrom && !dateTo}
                  className="text-xs"
                >
                  Сбросить
                </Button>
                <Button size="sm" onClick={handleApply} className="text-xs">
                  Применить
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// --- Empty States ---

function EmptyPending() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      <Hourglass className="h-12 w-12 text-muted-foreground" />
      <p className="text-sm text-muted-foreground max-w-sm">
        Реквизиты проверяются банком. Финансовая информация появится здесь сразу после успешной проверки.
      </p>
    </div>
  );
}

function EmptyNoData() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      <Wallet className="h-12 w-12 text-muted-foreground" />
      <p className="text-sm text-muted-foreground max-w-sm">
        После первых зарядных сессий здесь появится финансовая информация: баланс, история операций и возможность вывода средств.
      </p>
    </div>
  );
}

// --- Withdraw Dialog ---

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type LegalType = 'ooo' | 'ip' | 'selfemployed';

function WithdrawDialog({ open, onOpenChange }: WithdrawDialogProps) {
  const [legalType] = useState<LegalType>('ip');
  const [amount, setAmount] = useState('');
  const [saveDetails, setSaveDetails] = useState(true);
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [bic, setBic] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => setAmount(cleanDigits(e.target.value));
  const handleFillAll = () => setAmount(String(MOCK_SCENARIOS.filled_with_processing.balance - MOCK_SCENARIOS.filled_with_processing.processing));

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = cleanDigits(e.target.value);
    if (digits.length > 0 && digits[0] === '8') digits = '7' + digits.slice(1);
    if (digits.length === 0) { setPhone(''); return; }
    if (digits[0] !== '7') digits = '7' + digits;
    setPhone(digits.slice(0, 11));
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => setCardNumber(cleanDigits(e.target.value).slice(0, 16));
  const handleBicChange = (e: React.ChangeEvent<HTMLInputElement>) => setBic(cleanDigits(e.target.value).slice(0, 9));
  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => setAccountNumber(cleanDigits(e.target.value).slice(0, 20));

  const resetForm = () => { setAmount(''); setPhone(''); setBank(''); setCardNumber(''); setBic(''); setAccountNumber(''); setSaveDetails(true); };
  const handleSubmit = () => { onOpenChange(false); resetForm(); };

  const showTabs = legalType === 'ip' || legalType === 'selfemployed';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Вывод средств</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Сумма вывода</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input type="text" inputMode="numeric" placeholder="0" value={amount} onChange={handleAmountChange} className="pr-8" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">₽</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleFillAll} className="whitespace-nowrap">Вывести все</Button>
            </div>
          </div>

          {showTabs ? (
            <Tabs defaultValue="sbp">
              <TabsList className="w-full">
                <TabsTrigger value="sbp" className="flex-1 text-xs sm:text-sm">СБП</TabsTrigger>
                <TabsTrigger value="card" className="flex-1 text-xs sm:text-sm">Карта</TabsTrigger>
                <TabsTrigger value="account" className="flex-1 text-xs sm:text-sm">Расч. счет</TabsTrigger>
              </TabsList>
              <TabsContent value="sbp">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Телефон</Label>
                    <Input type="text" inputMode="numeric" placeholder="+7 900 000 00 00" value={phone ? formatPhone(phone) : ''} onChange={handlePhoneChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Банк получателя</Label>
                    <Select value={bank} onValueChange={setBank}>
                      <SelectTrigger><SelectValue placeholder="Выберите банк" /></SelectTrigger>
                      <SelectContent>{BANKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="card">
                <div className="space-y-2">
                  <Label>Номер карты</Label>
                  <Input type="text" inputMode="numeric" placeholder="0000 0000 0000 0000" maxLength={19} value={formatCard(cardNumber)} onChange={handleCardChange} />
                </div>
              </TabsContent>
              <TabsContent value="account">
                <AccountForm bic={bic} onBicChange={handleBicChange} accountNumber={accountNumber} onAccountChange={handleAccountChange} />
              </TabsContent>
            </Tabs>
          ) : (
            <>
              <p className="text-sm font-medium text-muted-foreground">На расчетный счет</p>
              <AccountForm bic={bic} onBicChange={handleBicChange} accountNumber={accountNumber} onAccountChange={handleAccountChange} />
            </>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Checkbox id="save-details" checked={saveDetails} onCheckedChange={(v) => setSaveDetails(v === true)} />
            <Label htmlFor="save-details" className="text-sm font-normal text-muted-foreground cursor-pointer">
              Сохранить реквизиты для следующих выводов
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Отмена</Button>
          <Button onClick={handleSubmit} disabled={!amount || Number(amount) <= 0}>Вывести</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AccountForm({ bic, onBicChange, accountNumber, onAccountChange }: {
  bic: string; onBicChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accountNumber: string; onAccountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>БИК</Label>
        <Input type="text" inputMode="numeric" placeholder="БИК" maxLength={9} value={bic} onChange={onBicChange} />
      </div>
      <div className="space-y-2">
        <Label>Номер счета</Label>
        <Input type="text" inputMode="numeric" placeholder="Номер счета" maxLength={20} value={accountNumber} onChange={onAccountChange} />
      </div>
    </div>
  );
}

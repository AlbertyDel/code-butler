import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { PageSkeleton } from '@/components/PageSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MockToggle } from '@/components/MockToggle';
import { useMockToggle } from '@/hooks/useMockToggle';
import { useIsMobile } from '@/hooks/use-mobile';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet, SheetContent,
} from '@/components/ui/sheet';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious, PaginationEllipsis,
} from '@/components/ui/pagination';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Wallet, Lock, Hourglass, Zap, ArrowDownToLine, Download, CalendarIcon,
  ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Star, CreditCard, Building2, Loader2,
  Search, ArrowLeft, Settings2,
} from 'lucide-react';
import { useBusinessState } from '@/contexts/BusinessStateContext';
import { format, isAfter, isBefore, startOfDay, endOfDay, setMonth, setYear } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import sbpIcon from '@/assets/sbp-icon.svg';

// ─── Types ───

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

type PaymentMethodType = 'sbp' | 'card' | 'account';

interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  title: string;
  maskedDetails: string;
  isDefault: boolean;
  data: Record<string, string>;
}

// ─── Mock SBP banks ───

interface SbpBank {
  bank_sbp_id: string;
  name_rus: string;
  bank_code: string;
}

const MOCK_SBP_BANKS: SbpBank[] = [
  { bank_sbp_id: '100000000001', name_rus: 'Сбербанк', bank_code: '044525225' },
  { bank_sbp_id: '100000000004', name_rus: 'Т-Банк', bank_code: '044525974' },
  { bank_sbp_id: '100000000002', name_rus: 'ВТБ', bank_code: '044525187' },
  { bank_sbp_id: '100000000003', name_rus: 'Альфа-Банк', bank_code: '044525593' },
  { bank_sbp_id: '100000000005', name_rus: 'Газпромбанк', bank_code: '044525823' },
  { bank_sbp_id: '100000000006', name_rus: 'Райффайзен Банк', bank_code: '044525700' },
  { bank_sbp_id: '100000000007', name_rus: 'Россельхозбанк', bank_code: '044525111' },
  { bank_sbp_id: '100000000008', name_rus: 'Открытие', bank_code: '044525985' },
  { bank_sbp_id: '100000000009', name_rus: 'Совкомбанк', bank_code: '044525360' },
  { bank_sbp_id: '100000000010', name_rus: 'Промсвязьбанк', bank_code: '044525555' },
  { bank_sbp_id: '100000000011', name_rus: 'Точка Банк', bank_code: '044525104' },
  { bank_sbp_id: '100000000012', name_rus: 'МТС Банк', bank_code: '044525232' },
];

// ─── Mock BIK lookup ───

const MOCK_BIK_DB: Record<string, string> = {
  '044525104': 'Точка Банк',
  '044525225': 'Сбербанк',
  '044525974': 'Т-Банк',
  '044525187': 'ВТБ',
  '044525593': 'Альфа-Банк',
};

function lookupBik(bik: string): { found: boolean; bankName?: string } {
  if (bik.length !== 9) return { found: false };
  const name = MOCK_BIK_DB[bik];
  return name ? { found: true, bankName: name } : { found: false };
}

// ─── Mock transactions ───

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

const METHODS_EMPTY: PaymentMethod[] = [];

const METHODS_SINGLE: PaymentMethod[] = [
  {
    id: 'pm-1',
    type: 'sbp',
    title: 'СБП · Т-Банк',
    maskedDetails: '+7 999 *** ** 12 · Т-Банк',
    isDefault: true,
    data: { phone: '79991234512', bank_sbp_id: '100000000004' },
  },
];

const METHODS_MULTIPLE: PaymentMethod[] = [
  {
    id: 'pm-1',
    type: 'sbp',
    title: 'СБП · Т-Банк',
    maskedDetails: '+7 999 *** ** 12 · Т-Банк',
    isDefault: true,
    data: { phone: '79991234512', bank_sbp_id: '100000000004' },
  },
  {
    id: 'pm-2',
    type: 'card',
    title: 'Карта · *1234',
    maskedDetails: '**** **** **** 1234',
    isDefault: false,
    data: { cardNumber: '4276123456781234', holderName: 'IVAN PETROV' },
  },
  {
    id: 'pm-3',
    type: 'account',
    title: 'Счёт · Точка Банк',
    maskedDetails: '40702************5220 · Точка Банк',
    isDefault: false,
    data: { bik: '044525104', accountNumber: '40702810000000005220' },
  },
];

type MethodsMockState = 'empty' | 'single' | 'multiple';

const ITEMS_PER_PAGE = 10;

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const MOCK_ERRORS = [
  'Недостаточно средств',
  'Банк СБП не найден',
  'Система не зарегистрирована в СБП',
  'Запрос уже в обработке',
  'Временная ошибка сервера',
];

// ─── Helpers ───

function formatPhone(digits: string): string {
  const d = digits.slice(0, 11);
  let result = '+7';
  if (d.length > 1) result += ' ' + d.slice(1, 4);
  if (d.length > 4) result += ' ' + d.slice(4, 7);
  if (d.length > 7) result += ' ' + d.slice(7, 9);
  if (d.length > 9) result += ' ' + d.slice(9, 11);
  return result;
}

function maskPhone(digits: string): string {
  if (digits.length < 11) return formatPhone(digits);
  return `+7 ${digits.slice(1, 4)} *** ** ${digits.slice(9, 11)}`;
}

function formatCard(digits: string): string {
  return digits.slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function maskCard(digits: string): string {
  return `**** **** **** ${digits.slice(-4)}`;
}

function maskAccount(acc: string): string {
  if (acc.length < 20) return acc;
  return acc.slice(0, 5) + '************' + acc.slice(-4);
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

function methodTypeIcon(type: PaymentMethodType) {
  switch (type) {
    case 'sbp': return <img src={sbpIcon} alt="СБП" className="h-4 w-4 shrink-0 object-contain" loading="lazy" />;
    case 'card': return <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />;
    case 'account': return <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />;
  }
}

function methodTypeLabel(type: PaymentMethodType) {
  switch (type) {
    case 'sbp': return 'СБП';
    case 'card': return 'Карта';
    case 'account': return 'Расчётный счёт';
  }
}

// ─── Main Component ───

type PageView = 'main' | 'manage_methods';

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
  const [methodsMockState, setMethodsMockState] = useState<MethodsMockState>('multiple');
  const [pageView, setPageView] = useState<PageView>('main');

  // Payment methods state
  const [methods, setMethods] = useState<PaymentMethod[]>(METHODS_MULTIPLE);

  // Mutable mock finance state for live updates after withdrawal
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const [liveProcessing, setLiveProcessing] = useState<number | null>(null);
  const [extraTransactions, setExtraTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Reset live overrides when mock state changes
  useEffect(() => {
    setLiveBalance(null);
    setLiveProcessing(null);
    setExtraTransactions([]);
  }, [mockState, showMock]);

  // Sync methods with methods mock state
  useEffect(() => {
    switch (methodsMockState) {
      case 'empty': setMethods([]); break;
      case 'single': setMethods(METHODS_SINGLE.map(m => ({ ...m }))); break;
      case 'multiple': setMethods(METHODS_MULTIPLE.map(m => ({ ...m }))); break;
    }
  }, [methodsMockState, showMock]);

  const hasMockData = showMock;
  const scenario = hasMockData ? MOCK_SCENARIOS[mockState] : null;
  const baseTransactions = scenario?.transactions ?? [];
  const transactions = useMemo(() => [...extraTransactions, ...baseTransactions], [extraTransactions, baseTransactions]);
  const balance = liveBalance ?? (scenario?.balance ?? 0);
  const processing = liveProcessing ?? (scenario?.processing ?? 0);
  const available = balance - processing;

  const isEmpty = !hasMockData ? true : (mockState === 'empty' && extraTransactions.length === 0);
  const hasData = hasMockData && !isEmpty;

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

  const handleWithdrawSuccess = useCallback((amount: number, saveMethod?: PaymentMethod) => {
    setLiveBalance(prev => prev ?? balance);
    setLiveProcessing(prev => (prev ?? processing) + amount);
    const newTx: Transaction = {
      id: `t-new-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'withdrawal',
      amount,
      status: 'processing',
    };
    setExtraTransactions(prev => [newTx, ...prev]);
    if (saveMethod) {
      setMethods(prev => {
        const newM = { ...saveMethod, id: `pm-${Date.now()}` };
        if (prev.length === 0) return [{ ...newM, isDefault: true }];
        return [...prev, newM];
      });
    }
  }, [balance, processing]);

  // Method management handlers
  const handleAddMethod = useCallback((method: PaymentMethod) => {
    const newM = { ...method, id: `pm-${Date.now()}` };
    setMethods(prev => {
      if (prev.length === 0) return [{ ...newM, isDefault: true }];
      return [...prev, newM];
    });
  }, []);

  const handleEditMethod = useCallback((method: PaymentMethod) => {
    setMethods(prev => prev.map(m => m.id === method.id ? method : m));
  }, []);

  const handleDeleteMethod = useCallback((id: string) => {
    setMethods(prev => {
      const next = prev.filter(m => m.id !== id);
      if (next.length > 0 && !next.some(m => m.isDefault)) {
        next[0].isDefault = true;
      }
      return next;
    });
  }, []);

  const handleSetDefault = useCallback((id: string) => {
    setMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
  }, []);

  if (isPageLoading) return <PageSkeleton cards={4} />;

  const isPending = businessState === 'pending';

  // ─── Manage Methods View ───
  if (pageView === 'manage_methods') {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPageView('main')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">Способы вывода</h2>
        </div>

        <ManageMethodsView
          methods={methods}
          onAdd={handleAddMethod}
          onEdit={handleEditMethod}
          onDelete={handleDeleteMethod}
          onSetDefault={handleSetDefault}
        />
      </div>
    );
  }

  // ─── Main Finance View ───
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Mock controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <MockToggle checked={showMock} onCheckedChange={setShowMock} />
        {showMock && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={mockState} onValueChange={(v) => setMockState(v as MockState)}>
              <SelectTrigger className="w-full sm:w-[220px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empty">Пустое состояние</SelectItem>
                <SelectItem value="filled_no_processing">Баланс, вывод = 0</SelectItem>
                <SelectItem value="filled_with_processing">Баланс + обработка</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodsMockState} onValueChange={(v) => setMethodsMockState(v as MethodsMockState)}>
              <SelectTrigger className="w-full sm:w-[200px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empty">Нет способов вывода</SelectItem>
                <SelectItem value="single">1 способ вывода</SelectItem>
                <SelectItem value="multiple">Несколько способов</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Content */}
      {isPending && !hasMockData ? (
        <EmptyPending />
      ) : isEmpty && !hasData ? (
        <EmptyNoData />
      ) : (
        <>
          {/* Top blocks: Summary + Methods overview */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
            {/* Summary Block */}
            <Card className="w-full sm:flex-1 sm:max-w-md">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Доступно к выводу</p>
                      <p className="text-3xl font-bold tracking-tight mt-0.5">{fmtMoney(available)} ₽</p>
                    </div>
                    {available > 0 && (
                      <Button onClick={() => setWithdrawOpen(true)} size="sm">Запросить вывод</Button>
                    )}
                  </div>
                  <div className="flex flex-row sm:flex-col gap-4 sm:gap-3 sm:items-end pt-1 sm:pt-0 border-t sm:border-t-0 border-border sm:min-w-[120px]">
                    <div className="sm:text-right">
                      <p className="text-xs text-muted-foreground">Баланс</p>
                      <p className="text-base font-semibold mt-0.5">{fmtMoney(balance)} ₽</p>
                    </div>
                    {processing > 0 && (
                      <div className="sm:text-right">
                        <div className="flex items-center gap-1 sm:justify-end">
                          <Lock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">В обработке</p>
                        </div>
                        <p className="text-base font-semibold text-muted-foreground mt-0.5">{fmtMoney(processing)} ₽</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payout Methods Overview */}
            <PayoutMethodsOverview
              methods={methods}
              onManage={() => setPageView('manage_methods')}
              onAddFirst={() => setPageView('manage_methods')}
            />
          </div>

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
                  {/* Desktop (lg+): single row */}
                  <div className="hidden lg:flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FilterTabs filter={filter} onChange={setFilter} />
                      <PeriodPicker dateFrom={dateFrom} dateTo={dateTo} onChangeFrom={setDateFrom} onChangeTo={setDateTo} />
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownloadCsv}>
                      <Download className="h-4 w-4 mr-1.5" />Выгрузить
                    </Button>
                  </div>
                  {/* Tablet (sm..lg): 3 rows */}
                  <div className="hidden sm:flex lg:hidden flex-col gap-3">
                    <FilterTabs filter={filter} onChange={setFilter} mobile />
                    <PeriodPicker dateFrom={dateFrom} dateTo={dateTo} onChangeFrom={setDateFrom} onChangeTo={setDateTo} />
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={handleDownloadCsv}>
                        <Download className="h-4 w-4 mr-1.5" />Выгрузить
                      </Button>
                    </div>
                  </div>
                  {/* Mobile (<sm): stacked */}
                  <div className="flex flex-col gap-2 sm:hidden">
                    <FilterTabs filter={filter} onChange={setFilter} mobile />
                    <PeriodPicker dateFrom={dateFrom} dateTo={dateTo} onChangeFrom={setDateFrom} onChangeTo={setDateTo} />
                    <Button variant="outline" size="sm" className="w-full" onClick={handleDownloadCsv}>
                      <Download className="h-4 w-4 mr-1.5" />Выгрузить
                    </Button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto -mx-4 sm:-mx-5">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4 sm:pl-5 text-center">Дата</TableHead>
                        <TableHead className="text-center">Описание</TableHead>
                        <TableHead className="text-center">Сумма</TableHead>
                        <TableHead className="text-center pr-4 sm:pr-5">Статус</TableHead>
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
                            <TableCell className={cn('font-medium whitespace-nowrap', t.type === 'income' && 'text-emerald-600')}>
                              {t.type === 'income' ? '+' : '−'}{t.amount.toLocaleString('ru-RU')} ₽
                            </TableCell>
                            <TableCell className="pr-4 sm:pr-5">
                              <span className={st.className}>{st.label}</span>
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
                          <PaginationItem key={`e-${i}`}><PaginationEllipsis /></PaginationItem>
                        ) : (
                          <PaginationItem key={page}>
                            <PaginationLink isActive={currentPage === page} onClick={() => setCurrentPage(page)} className="cursor-pointer">
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

      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        available={available}
        savedMethods={methods}
        onSuccess={handleWithdrawSuccess}
      />
    </div>
  );
}

// ─── Payout Methods Overview (compact card) ───

function PayoutMethodsOverview({
  methods,
  onManage,
  onAddFirst,
}: {
  methods: PaymentMethod[];
  onManage: () => void;
  onAddFirst: () => void;
}) {
  const defaultMethod = methods.find(m => m.isDefault) ?? methods[0];
  const otherCount = methods.length - 1;

  return (
    <Card className="w-full sm:w-auto sm:min-w-[260px] sm:max-w-[320px]">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">Способы вывода</p>
          {methods.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 -mr-2" onClick={onManage}>
              <Settings2 className="h-3.5 w-3.5" /> Управлять
            </Button>
          )}
        </div>

        {methods.length === 0 ? (
          <div className="text-center py-3">
            <p className="text-sm text-muted-foreground mb-3">Нет сохранённых способов</p>
            <Button variant="outline" size="sm" onClick={onAddFirst}>
              <Plus className="h-4 w-4 mr-1.5" /> Добавить способ
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted shrink-0">
                {methodTypeIcon(defaultMethod.type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{defaultMethod.title}</p>
                <p className="text-xs text-muted-foreground truncate">{defaultMethod.maskedDetails}</p>
              </div>
            </div>
            {otherCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Ещё {otherCount} {otherCount === 1 ? 'способ' : otherCount < 5 ? 'способа' : 'способов'}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Manage Methods View (full inline screen) ───

type ManageStep = 'list' | 'add' | 'edit';

function ManageMethodsView({
  methods,
  onAdd,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  methods: PaymentMethod[];
  onAdd: (m: PaymentMethod) => void;
  onEdit: (m: PaymentMethod) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}) {
  const [step, setStep] = useState<ManageStep>('list');
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSave = (method: PaymentMethod) => {
    if (step === 'edit' && editingMethod) {
      onEdit({ ...method, id: editingMethod.id, isDefault: editingMethod.isDefault });
    } else {
      onAdd(method);
    }
    setStep('list');
    setEditingMethod(null);
  };

  return (
    <>
      {step === 'list' ? (
        <div className="space-y-4 max-w-lg">
          {methods.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-4 space-y-3">
                  <Wallet className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Нет сохранённых способов вывода</p>
                  <Button onClick={() => { setEditingMethod(null); setStep('add'); }}>
                    <Plus className="h-4 w-4 mr-1.5" /> Добавить способ
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-2">
                {methods.map((m) => (
                  <Card key={m.id}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted shrink-0">
                        {methodTypeIcon(m.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium truncate">{methodTypeLabel(m.type)}</span>
                          {m.isDefault && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-primary">
                              <Star className="h-3 w-3 fill-primary" /> Основной
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{m.maskedDetails}</p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {!m.isDefault && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onSetDefault(m.id)} title="Сделать основным">
                            <Star className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingMethod(m); setStep('edit'); }} title="Изменить">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteConfirmId(m.id)} title="Удалить">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button variant="outline" onClick={() => { setEditingMethod(null); setStep('add'); }}>
                <Plus className="h-4 w-4 mr-1.5" /> Добавить способ
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="max-w-lg">
          <Card>
            <CardContent className="p-5 sm:p-6">
              <h3 className="text-base font-semibold mb-4">
                {step === 'edit' ? 'Редактирование способа' : 'Новый способ вывода'}
              </h3>
              <MethodForm
                initial={step === 'edit' ? editingMethod : null}
                onSave={handleSave}
                onCancel={() => { setStep('list'); setEditingMethod(null); }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(v) => { if (!v) setDeleteConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить способ вывода?</AlertDialogTitle>
            <AlertDialogDescription>Сохранённые реквизиты будут удалены. Это действие нельзя отменить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteConfirmId) { onDelete(deleteConfirmId); setDeleteConfirmId(null); } }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Filter Tabs ───

function FilterTabs({ filter, onChange, mobile }: { filter: FilterType; onChange: (f: FilterType) => void; mobile?: boolean }) {
  return (
    <div className={cn('flex gap-1 rounded-lg bg-muted p-1', mobile && 'w-full')}>
      {(['all', 'income', 'withdrawal'] as FilterType[]).map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={cn(
            'px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap text-center',
            mobile && 'flex-1',
            filter === f ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {f === 'all' ? 'Все' : f === 'income' ? 'Пополнения' : 'Списания'}
        </button>
      ))}
    </div>
  );
}

// ─── Calendar Body ───

function CalendarBody({
  dateFrom, dateTo, onChangeFrom, onChangeTo, onClose,
}: {
  dateFrom?: Date; dateTo?: Date;
  onChangeFrom: (d: Date | undefined) => void;
  onChangeTo: (d: Date | undefined) => void;
  onClose: () => void;
}) {
  const [calMonth, setCalMonth] = useState<Date>(dateFrom ?? new Date());
  const [selectingField, setSelectingField] = useState<'from' | 'to'>('from');
  const [showMonthSelect, setShowMonthSelect] = useState(false);
  const [localFrom, setLocalFrom] = useState(dateFrom);
  const [localTo, setLocalTo] = useState(dateTo);

  const handleSelect = (d: Date | undefined) => {
    if (!d) return;
    if (selectingField === 'from') {
      setLocalFrom(d);
      if (localTo && isAfter(d, localTo)) setLocalTo(undefined);
      setSelectingField('to');
    } else {
      if (localFrom && isBefore(d, localFrom)) {
        setLocalFrom(d);
      } else {
        setLocalTo(d);
      }
    }
  };

  const handleReset = () => {
    onChangeFrom(undefined);
    onChangeTo(undefined);
    setLocalFrom(undefined);
    setLocalTo(undefined);
    setSelectingField('from');
    onClose();
  };

  const handleApply = () => {
    onChangeFrom(localFrom);
    onChangeTo(localTo);
    onClose();
  };

  const currentMonth = calMonth.getMonth();
  const currentYear = calMonth.getFullYear();
  const yearRange = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

  return (
    <div className="flex flex-col">
      <div className="p-3 pointer-events-auto flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCalMonth(prev => setMonth(prev, prev.getMonth() - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button onClick={() => setShowMonthSelect(!showMonthSelect)} className="text-sm font-medium hover:underline px-2">
            {MONTHS_RU[currentMonth]} {currentYear}
          </button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCalMonth(prev => setMonth(prev, prev.getMonth() + 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setSelectingField('from')}
            className={cn(
              'flex-1 text-center text-xs py-1.5 rounded-md border transition-colors',
              selectingField === 'from' ? 'border-primary bg-primary/5 text-foreground' : 'border-transparent text-muted-foreground'
            )}
          >
            {localFrom ? format(localFrom, 'dd.MM.yyyy') : 'От'}
          </button>
          <button
            onClick={() => setSelectingField('to')}
            className={cn(
              'flex-1 text-center text-xs py-1.5 rounded-md border transition-colors',
              selectingField === 'to' ? 'border-primary bg-primary/5 text-foreground' : 'border-transparent text-muted-foreground'
            )}
          >
            {localTo ? format(localTo, 'dd.MM.yyyy') : 'До'}
          </button>
        </div>

        {showMonthSelect ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1 justify-center">
              {yearRange.map(y => (
                <button
                  key={y}
                  onClick={() => setCalMonth(setYear(calMonth, y))}
                  className={cn('px-2 py-1 text-xs rounded-md transition-colors', y === currentYear ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
                >
                  {y}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1">
              {MONTHS_RU.map((m, i) => (
                <button
                  key={m}
                  onClick={() => { setCalMonth(setMonth(calMonth, i)); setShowMonthSelect(false); }}
                  className={cn('px-2 py-1.5 text-xs rounded-md transition-colors', i === currentMonth ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Calendar
            mode="single"
            selected={selectingField === 'from' ? localFrom : localTo}
            onSelect={handleSelect}
            month={calMonth}
            onMonthChange={setCalMonth}
            locale={ru}
            className="p-0 pointer-events-auto"
            classNames={{ caption: 'hidden', nav: 'hidden' }}
            modifiers={{
              range_start: localFrom ? [localFrom] : [],
              range_end: localTo ? [localTo] : [],
              range_middle: localFrom && localTo ? { after: localFrom, before: localTo } : undefined,
            }}
            modifiersClassNames={{
              range_start: 'bg-primary text-primary-foreground rounded-l-md',
              range_end: 'bg-primary text-primary-foreground rounded-r-md',
              range_middle: 'bg-accent text-accent-foreground rounded-none',
            }}
          />
        )}
      </div>

      {!showMonthSelect && (
        <div className="flex items-center justify-between p-3 border-t border-border bg-background sticky bottom-0">
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={!localFrom && !localTo && !dateFrom && !dateTo} className="text-xs">
            Сбросить
          </Button>
          <Button size="sm" onClick={handleApply} className="text-xs">Применить</Button>
        </div>
      )}
    </div>
  );
}

// ─── Period Picker ───

function PeriodPicker({
  dateFrom, dateTo, onChangeFrom, onChangeTo,
}: {
  dateFrom?: Date; dateTo?: Date;
  onChangeFrom: (d: Date | undefined) => void;
  onChangeTo: (d: Date | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');

  const handleOpen = useCallback((nextOpen: boolean) => {
    if (nextOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setPlacement(spaceBelow < 420 ? 'top' : 'bottom');
    }
    setOpen(nextOpen);
  }, []);

  const trigger = (
    <button
      ref={triggerRef}
      onClick={() => handleOpen(true)}
      className={cn(
        'inline-flex items-center h-9 rounded-md border border-input bg-background text-sm transition-colors hover:bg-accent/50',
        'w-full sm:w-auto lg:min-w-[280px]'
      )}
    >
      <span className={cn('flex items-center justify-center h-full px-3 basis-1/2 min-w-0', !dateFrom && 'text-muted-foreground')}>
        <CalendarIcon className="h-3.5 w-3.5 mr-1.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{dateFrom ? format(dateFrom, 'dd.MM.yyyy') : 'От'}</span>
      </span>
      <span className="w-px h-4 bg-border shrink-0" />
      <span className={cn('flex items-center justify-center h-full px-3 basis-1/2 min-w-0', !dateTo && 'text-muted-foreground')}>
        <CalendarIcon className="h-3.5 w-3.5 mr-1.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{dateTo ? format(dateTo, 'dd.MM.yyyy') : 'До'}</span>
      </span>
    </button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="px-0 pt-2 pb-0 rounded-t-xl max-h-[85vh]">
            <CalendarBody dateFrom={dateFrom} dateTo={dateTo} onChangeFrom={onChangeFrom} onChangeTo={onChangeTo} onClose={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 max-h-[min(420px,calc(var(--radix-popper-available-height,420px)-8px))] flex flex-col overflow-hidden"
        align="start"
        side={placement}
        sideOffset={4}
        avoidCollisions={false}
      >
        <CalendarBody dateFrom={dateFrom} dateTo={dateTo} onChangeFrom={onChangeFrom} onChangeTo={onChangeTo} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

// ─── Empty States ───

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

// ─── Withdraw Dialog (restructured) ───

type WithdrawMode = 'saved' | 'new';

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  available: number;
  savedMethods: PaymentMethod[];
  onSuccess: (amount: number, saveMethod?: PaymentMethod) => void;
}

function WithdrawDialog({ open, onOpenChange, available, savedMethods, onSuccess }: WithdrawDialogProps) {
  const [mode, setMode] = useState<WithdrawMode>(savedMethods.length > 0 ? 'saved' : 'new');
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saveForFuture, setSaveForFuture] = useState(false);

  // New method form state
  const [newMethodData, setNewMethodData] = useState<PaymentMethod | null>(null);
  const [newMethodValid, setNewMethodValid] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(savedMethods.length > 0 ? 'saved' : 'new');
      setSelectedMethodId(savedMethods.find(m => m.isDefault)?.id ?? savedMethods[0]?.id ?? null);
      setAmount('');
      setErrors({});
      setSubmitError(null);
      setSubmitting(false);
      setSaveForFuture(false);
      setNewMethodData(null);
      setNewMethodValid(false);
    }
  }, [open, savedMethods]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const numAmount = parseInt(amount, 10);
    if (!amount || numAmount <= 0) e.amount = 'Введите сумму';
    else if (numAmount > available) e.amount = `Максимум ${fmtMoney(available)} ₽`;

    if (mode === 'saved' && !selectedMethodId) e.method = 'Выберите способ вывода';
    if (mode === 'new' && !newMethodValid) e.method = 'Заполните реквизиты';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);

    await new Promise(r => setTimeout(r, 1500));

    if (Math.random() < 0.15) {
      setSubmitError(MOCK_ERRORS[Math.floor(Math.random() * MOCK_ERRORS.length)]);
      setSubmitting(false);
      return;
    }

    const numAmount = parseInt(amount, 10);
    const methodToSave = mode === 'new' && saveForFuture && newMethodData ? newMethodData : undefined;
    onSuccess(numAmount, methodToSave);
    toast.success(`Заявка на вывод ${fmtMoney(numAmount)} ₽ создана`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Вывод средств</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 px-0.5">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label>Сумма вывода</Label>
            <div className="relative">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(cleanDigits(e.target.value))}
                className={cn('pr-8', errors.amount && 'border-destructive')}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">₽</span>
            </div>
            <div className="flex items-baseline gap-1 text-xs text-muted-foreground">
              <span>Доступно: {fmtMoney(available)} ₽</span>
              <span>·</span>
              <button
                type="button"
                onClick={() => setAmount(String(available))}
                className="text-primary hover:underline"
              >
                Вывести всю сумму
              </button>
            </div>
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>

          {/* Mode selector */}
          <div className="space-y-3">
            <Label>Реквизиты</Label>
            {savedMethods.length > 0 && (
              <div className="flex gap-1 rounded-lg bg-muted p-1">
                <button
                  onClick={() => setMode('saved')}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors text-center',
                    mode === 'saved' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Сохранённый способ
                </button>
                <button
                  onClick={() => setMode('new')}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors text-center',
                    mode === 'new' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Новые реквизиты
                </button>
              </div>
            )}

            {mode === 'saved' ? (
              <div className="space-y-1.5">
                {savedMethods.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMethodId(m.id)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      selectedMethodId === m.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted shrink-0">
                      {methodTypeIcon(m.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{methodTypeLabel(m.type)}</span>
                        {m.isDefault && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-primary">
                            <Star className="h-3 w-3 fill-primary" /> Основной
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{m.maskedDetails}</p>
                    </div>
                  </div>
                ))}
                {errors.method && <p className="text-xs text-destructive">{errors.method}</p>}
              </div>
            ) : (
              <div className="space-y-4">
                <InlineMethodForm
                  onValidChange={setNewMethodValid}
                  onDataChange={setNewMethodData}
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="save-for-future"
                    checked={saveForFuture}
                    onCheckedChange={(v) => setSaveForFuture(v === true)}
                  />
                  <label htmlFor="save-for-future" className="text-sm text-muted-foreground cursor-pointer select-none">
                    Сохранить для будущих выплат
                  </label>
                </div>
                {errors.method && <p className="text-xs text-destructive">{errors.method}</p>}
              </div>
            )}
          </div>

          {submitError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">{submitError}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Вывести
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Inline Method Form (for withdraw dialog "new" mode) ───

function InlineMethodForm({
  onValidChange,
  onDataChange,
}: {
  onValidChange: (valid: boolean) => void;
  onDataChange: (data: PaymentMethod | null) => void;
}) {
  const [type, setType] = useState<PaymentMethodType>('sbp');

  // SBP
  const [phone, setPhone] = useState('');
  const [bankId, setBankId] = useState('');
  const [bankSearch, setBankSearch] = useState('');

  // Card
  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('');

  // Account
  const [bik, setBik] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bikResult, setBikResult] = useState<{ found: boolean; bankName?: string } | null>(null);

  useEffect(() => {
    if (bik.length === 9) setBikResult(lookupBik(bik));
    else setBikResult(null);
  }, [bik]);

  const filteredBanks = useMemo(() => {
    if (!bankSearch) return MOCK_SBP_BANKS;
    const q = bankSearch.toLowerCase();
    return MOCK_SBP_BANKS.filter(b => b.name_rus.toLowerCase().includes(q));
  }, [bankSearch]);

  const selectedBank = MOCK_SBP_BANKS.find(b => b.bank_sbp_id === bankId);

  // Validate and propagate
  useEffect(() => {
    let valid = false;
    let method: PaymentMethod | null = null;

    if (type === 'sbp' && phone.length === 11 && bankId) {
      valid = true;
      const bank = MOCK_SBP_BANKS.find(b => b.bank_sbp_id === bankId)!;
      method = {
        id: 'new',
        type: 'sbp',
        title: `СБП · ${bank.name_rus}`,
        maskedDetails: `${maskPhone(phone)} · ${bank.name_rus}`,
        isDefault: false,
        data: { phone, bank_sbp_id: bankId },
      };
    } else if (type === 'card' && cardNumber.length >= 13 && holderName.trim()) {
      valid = true;
      method = {
        id: 'new',
        type: 'card',
        title: `Карта · *${cardNumber.slice(-4)}`,
        maskedDetails: maskCard(cardNumber),
        isDefault: false,
        data: { cardNumber, holderName },
      };
    } else if (type === 'account' && bik.length === 9 && bikResult?.found && accountNumber.length === 20) {
      valid = true;
      method = {
        id: 'new',
        type: 'account',
        title: `Счёт · ${bikResult.bankName}`,
        maskedDetails: `${maskAccount(accountNumber)} · ${bikResult.bankName}`,
        isDefault: false,
        data: { bik, accountNumber },
      };
    }

    onValidChange(valid);
    onDataChange(method);
  }, [type, phone, bankId, cardNumber, holderName, bik, accountNumber, bikResult, onValidChange, onDataChange]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = cleanDigits(e.target.value);
    if (digits.length > 0 && digits[0] === '8') digits = '7' + digits.slice(1);
    if (digits.length === 0) { setPhone(''); return; }
    if (digits[0] !== '7') digits = '7' + digits;
    setPhone(digits.slice(0, 11));
  };

  return (
    <div className="space-y-3">
      <Tabs value={type} onValueChange={(v) => setType(v as PaymentMethodType)}>
        <TabsList className="w-full">
          <TabsTrigger value="sbp" className="flex-1 text-xs sm:text-sm gap-1.5">
            <img src={sbpIcon} alt="СБП" className="h-4 w-4 object-contain" loading="lazy" />
            СБП
          </TabsTrigger>
          <TabsTrigger value="card" className="flex-1 text-xs sm:text-sm gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Карта
          </TabsTrigger>
          <TabsTrigger value="account" className="flex-1 text-xs sm:text-sm gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Счёт
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {type === 'sbp' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Телефон</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="+7 900 000 00 00"
              value={phone ? formatPhone(phone) : ''}
              onChange={handlePhoneChange}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Банк получателя</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn('w-full justify-between font-normal', !bankId && 'text-muted-foreground')}
                >
                  <div className="flex items-center gap-2 truncate">
                    {bankId && <img src={sbpIcon} alt="" className="h-4 w-4 object-contain shrink-0" loading="lazy" />}
                    <span className="truncate">{selectedBank?.name_rus ?? 'Выберите банк'}</span>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Поиск банка..."
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                </div>
                <ScrollArea className="max-h-[200px]">
                  <div className="p-1">
                    {filteredBanks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Банк СБП не найден</p>
                    ) : filteredBanks.map((b) => (
                      <button
                        key={b.bank_sbp_id}
                        onClick={() => { setBankId(b.bank_sbp_id); setBankSearch(''); }}
                        className={cn(
                          'w-full text-left px-2 py-1.5 text-sm rounded-sm transition-colors flex items-center gap-2',
                          bankId === b.bank_sbp_id ? 'bg-accent' : 'hover:bg-accent/50'
                        )}
                      >
                        <img src={sbpIcon} alt="" className="h-3.5 w-3.5 object-contain shrink-0" loading="lazy" />
                        {b.name_rus}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {type === 'card' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Номер карты</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              value={formatCard(cardNumber)}
              onChange={(e) => setCardNumber(cleanDigits(e.target.value).slice(0, 16))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>ФИО получателя</Label>
            <Input
              placeholder="Иванов Иван Иванович"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
            />
          </div>
        </div>
      )}

      {type === 'account' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>БИК</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="044525104"
              maxLength={9}
              value={bik}
              onChange={(e) => setBik(cleanDigits(e.target.value).slice(0, 9))}
            />
            {bik.length === 9 && bikResult && (
              bikResult.found ? (
                <p className="text-xs text-emerald-600">{bikResult.bankName}</p>
              ) : (
                <p className="text-xs text-destructive">Банк с таким БИК не найден</p>
              )
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Номер счёта</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="40702810000000005220"
              maxLength={20}
              value={accountNumber}
              onChange={(e) => setAccountNumber(cleanDigits(e.target.value).slice(0, 20))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Method Form (for manage methods: add/edit) ───

function MethodForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: PaymentMethod | null;
  onSave: (m: PaymentMethod) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<PaymentMethodType>(initial?.type ?? 'sbp');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [phone, setPhone] = useState(initial?.data?.phone ?? '');
  const [bankId, setBankId] = useState(initial?.data?.bank_sbp_id ?? '');
  const [bankSearch, setBankSearch] = useState('');

  const [cardNumber, setCardNumber] = useState(initial?.data?.cardNumber ?? '');
  const [holderName, setHolderName] = useState(initial?.data?.holderName ?? '');

  const [bik, setBik] = useState(initial?.data?.bik ?? '');
  const [accountNumber, setAccountNumber] = useState(initial?.data?.accountNumber ?? '');
  const [bikResult, setBikResult] = useState<{ found: boolean; bankName?: string } | null>(null);

  useEffect(() => {
    if (bik.length === 9) setBikResult(lookupBik(bik));
    else setBikResult(null);
  }, [bik]);

  const filteredBanks = useMemo(() => {
    if (!bankSearch) return MOCK_SBP_BANKS;
    const q = bankSearch.toLowerCase();
    return MOCK_SBP_BANKS.filter(b => b.name_rus.toLowerCase().includes(q));
  }, [bankSearch]);

  const selectedBank = MOCK_SBP_BANKS.find(b => b.bank_sbp_id === bankId);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = cleanDigits(e.target.value);
    if (digits.length > 0 && digits[0] === '8') digits = '7' + digits.slice(1);
    if (digits.length === 0) { setPhone(''); return; }
    if (digits[0] !== '7') digits = '7' + digits;
    setPhone(digits.slice(0, 11));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (type === 'sbp') {
      if (phone.length < 11) e.phone = 'Введите телефон';
      if (!bankId) e.bank = 'Выберите банк';
    } else if (type === 'card') {
      if (cardNumber.length < 13) e.card = 'Введите номер карты';
      if (!holderName.trim()) e.holder = 'Введите ФИО получателя';
    } else {
      if (bik.length !== 9) e.bik = 'Введите БИК';
      else if (!bikResult?.found) e.bik = 'Банк с таким БИК не найден';
      if (accountNumber.length !== 20) e.account = 'Введите номер счёта';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    let title = '';
    let masked = '';
    let data: Record<string, string> = {};

    if (type === 'sbp') {
      const bank = MOCK_SBP_BANKS.find(b => b.bank_sbp_id === bankId)!;
      title = `СБП · ${bank.name_rus}`;
      masked = `${maskPhone(phone)} · ${bank.name_rus}`;
      data = { phone, bank_sbp_id: bankId };
    } else if (type === 'card') {
      title = `Карта · *${cardNumber.slice(-4)}`;
      masked = maskCard(cardNumber);
      data = { cardNumber, holderName };
    } else {
      title = `Счёт · ${bikResult!.bankName}`;
      masked = `${maskAccount(accountNumber)} · ${bikResult!.bankName}`;
      data = { bik, accountNumber };
    }

    onSave({
      id: initial?.id ?? 'new',
      type,
      title,
      maskedDetails: masked,
      isDefault: initial?.isDefault ?? false,
      data,
    });
  };

  return (
    <div className="space-y-4">
      {!initial && (
        <Tabs value={type} onValueChange={(v) => { setType(v as PaymentMethodType); setErrors({}); }}>
          <TabsList className="w-full">
            <TabsTrigger value="sbp" className="flex-1 text-xs sm:text-sm gap-1.5">
              <img src={sbpIcon} alt="СБП" className="h-4 w-4 object-contain" loading="lazy" />
              СБП
            </TabsTrigger>
            <TabsTrigger value="card" className="flex-1 text-xs sm:text-sm gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Карта
            </TabsTrigger>
            <TabsTrigger value="account" className="flex-1 text-xs sm:text-sm gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Счёт
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {initial && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {methodTypeIcon(type)} {methodTypeLabel(type)}
        </div>
      )}

      {type === 'sbp' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Телефон</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="+7 900 000 00 00"
              value={phone ? formatPhone(phone) : ''}
              onChange={handlePhoneChange}
              className={cn(errors.phone && 'border-destructive')}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Банк получателя</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn('w-full justify-between font-normal', !bankId && 'text-muted-foreground', errors.bank && 'border-destructive')}
                >
                  <div className="flex items-center gap-2 truncate">
                    {bankId && <img src={sbpIcon} alt="" className="h-4 w-4 object-contain shrink-0" loading="lazy" />}
                    <span className="truncate">{selectedBank?.name_rus ?? 'Выберите банк'}</span>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Поиск банка..."
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                </div>
                <ScrollArea className="max-h-[200px]">
                  <div className="p-1">
                    {filteredBanks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Банк СБП не найден</p>
                    ) : filteredBanks.map((b) => (
                      <button
                        key={b.bank_sbp_id}
                        onClick={() => { setBankId(b.bank_sbp_id); setBankSearch(''); }}
                        className={cn(
                          'w-full text-left px-2 py-1.5 text-sm rounded-sm transition-colors flex items-center gap-2',
                          bankId === b.bank_sbp_id ? 'bg-accent' : 'hover:bg-accent/50'
                        )}
                      >
                        <img src={sbpIcon} alt="" className="h-3.5 w-3.5 object-contain shrink-0" loading="lazy" />
                        {b.name_rus}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
            {errors.bank && <p className="text-xs text-destructive">{errors.bank}</p>}
          </div>
        </div>
      )}

      {type === 'card' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Номер карты</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              value={formatCard(cardNumber)}
              onChange={(e) => setCardNumber(cleanDigits(e.target.value).slice(0, 16))}
              className={cn(errors.card && 'border-destructive')}
            />
            {errors.card && <p className="text-xs text-destructive">{errors.card}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>ФИО получателя</Label>
            <Input
              placeholder="Иванов Иван Иванович"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              className={cn(errors.holder && 'border-destructive')}
            />
            {errors.holder && <p className="text-xs text-destructive">{errors.holder}</p>}
          </div>
        </div>
      )}

      {type === 'account' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>БИК</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="044525104"
              maxLength={9}
              value={bik}
              onChange={(e) => setBik(cleanDigits(e.target.value).slice(0, 9))}
              className={cn(errors.bik && 'border-destructive')}
            />
            {bik.length === 9 && bikResult && (
              bikResult.found ? (
                <p className="text-xs text-emerald-600">{bikResult.bankName}</p>
              ) : (
                <p className="text-xs text-destructive">Банк с таким БИК не найден</p>
              )
            )}
            {errors.bik && <p className="text-xs text-destructive">{errors.bik}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Номер счёта</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="40702810000000005220"
              maxLength={20}
              value={accountNumber}
              onChange={(e) => setAccountNumber(cleanDigits(e.target.value).slice(0, 20))}
              className={cn(errors.account && 'border-destructive')}
            />
            {errors.account && <p className="text-xs text-destructive">{errors.account}</p>}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">Отмена</Button>
        <Button onClick={handleSave} className="flex-1">Сохранить</Button>
      </div>
    </div>
  );
}

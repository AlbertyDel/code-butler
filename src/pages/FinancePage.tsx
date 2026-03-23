import { useState, useCallback, useEffect } from 'react';
import { PageSkeleton } from '@/components/PageSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Wallet, Lock, Hourglass, Zap, ArrowDownToLine, Download,
} from 'lucide-react';
import { useBusinessState } from '@/contexts/BusinessStateContext';
import { format } from 'date-fns';

// --- Types ---

type TransactionType = 'income' | 'withdrawal';
type TransactionStatus = 'success' | 'processing' | 'error';
type LegalType = 'ooo' | 'ip' | 'selfemployed';
type FilterType = 'all' | 'income' | 'withdrawal';

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  stationName?: string;
}

// --- Mock data ---

const mockTransactions: Transaction[] = [
  {
    id: 't-1', date: '2025-03-22T14:30:00Z', description: 'Зарядка',
    type: 'income', amount: 490, status: 'success', stationName: 'ЭЗС Москва-Сити',
  },
  {
    id: 't-2', date: '2025-03-21T09:15:00Z', description: 'Зарядка',
    type: 'income', amount: 750, status: 'success', stationName: 'ЭЗС ВДНХ',
  },
  {
    id: 't-3', date: '2025-03-20T18:00:00Z', description: 'Вывод средств',
    type: 'withdrawal', amount: 5000, status: 'processing',
  },
  {
    id: 't-4', date: '2025-03-19T11:45:00Z', description: 'Зарядка',
    type: 'income', amount: 392, status: 'success', stationName: 'ЭЗС ТЦ Европейский',
  },
  {
    id: 't-5', date: '2025-03-18T20:10:00Z', description: 'Вывод средств',
    type: 'withdrawal', amount: 3000, status: 'success',
  },
  {
    id: 't-6', date: '2025-03-17T08:30:00Z', description: 'Зарядка',
    type: 'income', amount: 168, status: 'success', stationName: 'ЭЗС Арбат',
  },
  {
    id: 't-7', date: '2025-03-16T15:00:00Z', description: 'Вывод средств',
    type: 'withdrawal', amount: 2000, status: 'error',
  },
];

const AVAILABLE_BALANCE = 14500;
const PROCESSING_BALANCE = 5000;

const BANKS = [
  'Сбербанк', 'Тинькофф', 'Альфа-Банк', 'ВТБ', 'Газпромбанк',
  'Райффайзен', 'Россельхозбанк', 'Открытие', 'Совкомбанк', 'Промсвязьбанк',
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
  const d = digits.slice(0, 16);
  return d.replace(/(.{4})/g, '$1 ').trim();
}

function cleanDigits(value: string): string {
  return value.replace(/\D/g, '');
}

const statusMap: Record<TransactionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  success: { label: 'Успешно', variant: 'default' },
  processing: { label: 'В обработке', variant: 'secondary' },
  error: { label: 'Ошибка', variant: 'destructive' },
};

// --- Component ---

export default function FinancePage() {
  const { businessState } = useBusinessState();
  const [filter, setFilter] = useState<FilterType>('all');
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  // For demo, toggle between empty and populated
  const showData = businessState === 'active';
  const transactions = showData ? mockTransactions : [];

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter((t) => t.type === filter);

  const handleDownloadCsv = useCallback(() => {
    const header = 'Дата,Описание,Сумма,Статус\n';
    const rows = filtered.map((t) => {
      const date = format(new Date(t.date), 'dd.MM.yyyy HH:mm');
      const desc = t.type === 'income' ? `Зарядка: ${t.stationName}` : 'Вывод средств';
      const amount = t.type === 'income' ? `+${t.amount}` : `-${t.amount}`;
      return `${date},"${desc}",${amount},${statusMap[t.status].label}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* BLOCK 1: Dashboard cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-muted-foreground">Доступно к выводу</p>
            <p className="text-3xl font-bold text-primary">
              {AVAILABLE_BALANCE.toLocaleString('ru-RU')} ₽
            </p>
            <Button onClick={() => setWithdrawOpen(true)} className="w-full sm:w-auto">
              Запросить вывод
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">В обработке</p>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold text-muted-foreground">
              {PROCESSING_BALANCE.toLocaleString('ru-RU')} ₽
            </p>
            <p className="text-xs text-muted-foreground">Сумма ожидаемых выплат</p>
          </CardContent>
        </Card>
      </div>

      {/* BLOCK 2 / 3: Empty states or table */}
      {businessState === 'pending' ? (
        <EmptyPending />
      ) : transactions.length === 0 ? (
        <EmptyApproved />
      ) : (
        <Card>
          <CardContent className="p-5 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex gap-1 rounded-lg bg-muted p-1">
                {(['all', 'income', 'withdrawal'] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      filter === f
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f === 'all' ? 'Все' : f === 'income' ? 'Пополнения' : 'Списания'}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadCsv}>
                <Download className="h-4 w-4 mr-1.5" />
                Скачать CSV
              </Button>
            </div>

            {/* Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead className="text-right">Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {format(new Date(t.date), 'dd.MM.yyyy, HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {t.type === 'income' ? (
                          <Zap className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <ArrowDownToLine className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span>
                          {t.type === 'income' ? `Зарядка: ${t.stationName}` : 'Вывод средств'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-medium whitespace-nowrap ${
                      t.type === 'income' ? 'text-green-600' : ''
                    }`}>
                      {t.type === 'income' ? '+' : '−'}{t.amount.toLocaleString('ru-RU')} ₽
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={statusMap[t.status].variant}>
                        {statusMap[t.status].label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* BLOCK 4: Withdrawal dialog */}
      <WithdrawDialog open={withdrawOpen} onOpenChange={setWithdrawOpen} />
    </div>
  );
}

// --- Empty States ---

function EmptyPending() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      <Hourglass className="h-12 w-12 text-muted-foreground" />
      <p className="text-sm text-muted-foreground max-w-sm">
        Реквизиты проверяются банком. История транзакций появится здесь сразу после успешной проверки.
      </p>
    </div>
  );
}

function EmptyApproved() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      <Wallet className="h-12 w-12 text-muted-foreground" />
      <p className="text-sm text-muted-foreground max-w-sm">
        Выручка от первых зарядных сессий появится в этом разделе. Настройте тарифы, чтобы начать зарабатывать.
      </p>
    </div>
  );
}

// --- Withdraw Dialog ---

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function WithdrawDialog({ open, onOpenChange }: WithdrawDialogProps) {
  // For demo, hardcode legal type. In real app, derive from user context.
  const [legalType] = useState<LegalType>('ip');
  const [amount, setAmount] = useState('');
  const [saveDetails, setSaveDetails] = useState(true);

  // SBP
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState('');

  // Card
  const [cardNumber, setCardNumber] = useState('');

  // Account
  const [bic, setBic] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(cleanDigits(e.target.value));
  };

  const handleFillAll = () => {
    setAmount(String(AVAILABLE_BALANCE));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = cleanDigits(e.target.value);
    if (digits.length > 0 && digits[0] === '8') {
      digits = '7' + digits.slice(1);
    }
    if (digits.length === 0) {
      setPhone('');
      return;
    }
    if (digits[0] !== '7') {
      digits = '7' + digits;
    }
    setPhone(digits.slice(0, 11));
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(cleanDigits(e.target.value).slice(0, 16));
  };

  const handleBicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBic(cleanDigits(e.target.value).slice(0, 9));
  };

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccountNumber(cleanDigits(e.target.value).slice(0, 20));
  };

  const handleSubmit = () => {
    // In real app, submit withdrawal request
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setAmount('');
    setPhone('');
    setBank('');
    setCardNumber('');
    setBic('');
    setAccountNumber('');
    setSaveDetails(true);
  };

  const showTabs = legalType === 'ip' || legalType === 'selfemployed';

  const amountField = (
    <div className="space-y-2">
      <Label>Сумма вывода</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={handleAmountChange}
            className="pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            ₽
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={handleFillAll} className="whitespace-nowrap">
          Вывести все
        </Button>
      </div>
    </div>
  );

  const saveCheckbox = (
    <div className="flex items-center gap-2 pt-2">
      <Checkbox
        id="save-details"
        checked={saveDetails}
        onCheckedChange={(v) => setSaveDetails(v === true)}
      />
      <Label htmlFor="save-details" className="text-sm font-normal text-muted-foreground cursor-pointer">
        Сохранить реквизиты для следующих выводов
      </Label>
    </div>
  );

  const sbpForm = (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Телефон</Label>
        <Input
          type="text"
          inputMode="numeric"
          placeholder="+7 900 000 00 00"
          value={phone ? formatPhone(phone) : ''}
          onChange={handlePhoneChange}
        />
      </div>
      <div className="space-y-2">
        <Label>Банк получателя</Label>
        <Select value={bank} onValueChange={setBank}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите банк" />
          </SelectTrigger>
          <SelectContent>
            {BANKS.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const cardForm = (
    <div className="space-y-2">
      <Label>Номер карты</Label>
      <Input
        type="text"
        inputMode="numeric"
        placeholder="0000 0000 0000 0000"
        maxLength={19}
        value={formatCard(cardNumber)}
        onChange={handleCardChange}
      />
    </div>
  );

  const accountForm = (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>БИК</Label>
        <Input
          type="text"
          inputMode="numeric"
          placeholder="БИК"
          maxLength={9}
          value={bic}
          onChange={handleBicChange}
        />
      </div>
      <div className="space-y-2">
        <Label>Номер счета</Label>
        <Input
          type="text"
          inputMode="numeric"
          placeholder="Номер счета"
          maxLength={20}
          value={accountNumber}
          onChange={handleAccountChange}
        />
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Вывод средств</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {amountField}

          {showTabs ? (
            <Tabs defaultValue="sbp">
              <TabsList className="w-full">
                <TabsTrigger value="sbp" className="flex-1 text-xs sm:text-sm">СБП</TabsTrigger>
                <TabsTrigger value="card" className="flex-1 text-xs sm:text-sm">Карта</TabsTrigger>
                <TabsTrigger value="account" className="flex-1 text-xs sm:text-sm">Расч. счет</TabsTrigger>
              </TabsList>
              <TabsContent value="sbp">{sbpForm}</TabsContent>
              <TabsContent value="card">{cardForm}</TabsContent>
              <TabsContent value="account">{accountForm}</TabsContent>
            </Tabs>
          ) : (
            <>
              <p className="text-sm font-medium text-muted-foreground">На расчетный счет</p>
              {accountForm}
            </>
          )}

          {saveCheckbox}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!amount || Number(amount) <= 0}>
            Вывести
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

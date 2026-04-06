import { useState, useEffect, useRef } from 'react';
import { PageSkeleton } from '@/components/PageSkeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessState } from '@/contexts/BusinessStateContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Phone, Mail, Pencil, Clock, BadgeCheck, XCircle,
  CheckCircle2, AlertTriangle, Loader2, ShieldCheck, MapPin,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

/* ── Phone helpers ── */
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  let d = digits;
  if (d.startsWith('8') && d.length > 1) d = '7' + d.slice(1);
  if (!d.startsWith('7') && d.length > 0) d = '7' + d;
  if (d.length === 0) return '';
  if (d.length <= 1) return '+7';
  if (d.length <= 4) return `+7 (${d.slice(1)}`;
  if (d.length <= 7) return `+7 (${d.slice(1, 4)}) ${d.slice(4)}`;
  if (d.length <= 9) return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
}
function isValidPhone(value: string): boolean {
  return value.replace(/\D/g, '').length === 11;
}

/* ── Rejected form: INN mock data ── */
type LegalTab = 'ooo' | 'ip' | 'sz';
const INN_MAX: Record<LegalTab, number> = { ooo: 10, ip: 12, sz: 12 };

type MockResult = {
  type: 'success' | 'error';
  title?: string;
  subtitle?: string;
  text: string;
  autoAddress?: string;
};

const MOCK_DATA: Record<LegalTab, Record<string, MockResult>> = {
  ooo: {
    '1234567890': { type: 'success', title: 'ООО "Заряд Плюс"', subtitle: 'ИНН: 1234567890 • КПП: 770501001 • ОГРН: 1127746543210', text: '' },
  },
  ip: {
    '123456789012': { type: 'success', title: 'ИП Петров Иван Сергеевич', subtitle: 'ИНН: 123456789012 • ОГРНИП: 312774654321012', text: '', autoAddress: 'г. Москва, ул. Примерная, д. 1' },
  },
  sz: {
    '987654321098': { type: 'success', title: 'Петров Иван Сергеевич (НПД)', subtitle: 'ИНН: 987654321098', text: '', autoAddress: 'г. Москва, ул. Примерная, д. 1' },
  },
};

function getFeedback(tab: LegalTab, inn: string, maxLen: number): MockResult | null {
  if (inn.length !== maxLen) return null;
  return MOCK_DATA[tab][inn] ?? { type: 'error' as const, text: 'ИНН не найден. Проверьте данные.' };
}

/* ── Inline rejected edit form ── */
function RejectedEditForm({ onSubmitted, onCancel }: { onSubmitted: () => void; onCancel: () => void }) {
  const [tab, setTab] = useState<LegalTab>('ooo');
  const [inn, setInn] = useState('1234567890');
  const [address, setAddress] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [searching, setSearching] = useState(false);
  const [visibleFeedback, setVisibleFeedback] = useState<MockResult | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxLen = INN_MAX[tab];
  const hasError = visibleFeedback?.type === 'error';
  const needsAddress = tab === 'ip' || tab === 'sz';

  const triggerShake = () => {
    setShaking(true);
    if (window.navigator?.vibrate) window.navigator.vibrate(50);
    setTimeout(() => setShaking(false), 400);
  };

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setVisibleFeedback(null);
    if (inn.length === maxLen) {
      setSearching(true);
      searchTimerRef.current = setTimeout(() => {
        const result = getFeedback(tab, inn, maxLen);
        setVisibleFeedback(result);
        setSearching(false);
        if (result?.type === 'error') triggerShake();
        if (result?.type === 'success' && result.autoAddress) setAddress(result.autoAddress);
      }, 1000);
    } else {
      setSearching(false);
    }
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inn, tab, maxLen]);

  const handleInnChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length > maxLen) { triggerShake(); return; }
    setInn(digits);
    setFieldErrors((prev) => { const { inn: _, ...rest } = prev; return rest; });
  };

  const handleTabChange = (v: string) => {
    setTab(v as LegalTab);
    setInn(''); setAddress(''); setAgreed(false);
    setVisibleFeedback(null); setSearching(false); setFieldErrors({});
  };

  const handleSubmit = async () => {
    const errors: Record<string, string> = {};
    if (inn.length === 0) errors.inn = 'Поле обязательно для заполнения';
    else if (inn.length !== maxLen) errors.inn = `ИНН должен содержать ${maxLen} цифр`;
    else if (visibleFeedback?.type === 'error' || (!visibleFeedback && !searching)) errors.inn = 'ИНН не найден';
    if (needsAddress && !address.trim()) errors.address = 'Укажите адрес регистрации';
    if (!agreed) errors.agreed = 'Необходимо согласие';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitting(false);
    onSubmitted();
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-blue-700">
          Для приема платежей и вывода средств мы бесплатно откроем для вас виртуальный счет в ПАО Банк Точка.
        </p>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList className="w-full h-auto flex flex-col sm:flex-row bg-muted/60 p-1 gap-1">
          <TabsTrigger value="ooo" className="w-full py-2.5 text-xs sm:text-sm whitespace-normal text-center data-[state=active]:bg-white data-[state=active]:shadow-sm">Юр. лицо (ООО)</TabsTrigger>
          <TabsTrigger value="ip" className="w-full py-2.5 text-xs sm:text-sm whitespace-normal text-center data-[state=active]:bg-white data-[state=active]:shadow-sm">ИП</TabsTrigger>
          <TabsTrigger value="sz" className="w-full py-2.5 text-xs sm:text-sm whitespace-normal text-center data-[state=active]:bg-white data-[state=active]:shadow-sm">Самозанятый</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        <Label>ИНН</Label>
        <div className="relative">
          <Input
            value={inn}
            onChange={(e) => handleInnChange(e.target.value)}
            placeholder={`${maxLen} цифр`}
            maxLength={maxLen + 1}
            inputMode="numeric"
            className={cn('pr-10', shaking && 'animate-shake', (hasError || fieldErrors.inn) && 'border-destructive focus-visible:ring-destructive')}
          />
          {searching && (
            <span className="absolute right-3 top-0 bottom-0 flex items-center pointer-events-none">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </span>
          )}
        </div>
        {visibleFeedback && (
          <div className={cn('rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200', visibleFeedback.type === 'success' ? 'bg-emerald-50 border border-emerald-200' : 'bg-destructive/5 border border-destructive/20')}>
            <div className="flex items-start gap-3">
              {visibleFeedback.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" /> : <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />}
              <div className="min-w-0">
                {visibleFeedback.title && <p className="font-semibold text-foreground">{visibleFeedback.title}</p>}
                {visibleFeedback.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{visibleFeedback.subtitle}</p>}
                {visibleFeedback.text && <p className={cn('text-sm', visibleFeedback.type === 'error' ? 'text-destructive' : 'text-foreground')}>{visibleFeedback.text}</p>}
              </div>
            </div>
          </div>
        )}
        {fieldErrors.inn && !visibleFeedback && <p className="text-destructive text-xs mt-1">{fieldErrors.inn}</p>}
      </div>

      {needsAddress && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <Label>Адрес регистрации</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-0 bottom-0 h-full w-4 text-muted-foreground pointer-events-none" />
            <Input value={address} onChange={(e) => setAddress(e.target.value)} className={cn("pl-9", fieldErrors.address && "border-destructive focus-visible:ring-destructive")} />
          </div>
          {fieldErrors.address && <p className="text-destructive text-xs mt-1">{fieldErrors.address}</p>}
        </div>
      )}

      <label className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          checked={agreed}
          onCheckedChange={(v) => {
            setAgreed(v === true);
            if (v === true) setFieldErrors((prev) => { const { agreed: _, ...rest } = prev; return rest; });
          }}
          className={cn("mt-0.5 h-5 w-5 rounded-[4px] border-2", fieldErrors.agreed && "border-destructive")}
        />
        <span className="text-sm text-muted-foreground leading-snug">
          Я согласен на обработку персональных данных и передачу информации в ПАО Банк Точка
        </span>
      </label>
      {fieldErrors.agreed && <p className="text-destructive text-xs -mt-4 ml-8">{fieldErrors.agreed}</p>}

      <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
        <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto h-11 sm:h-10 text-sm font-medium">
          Отмена
        </Button>
        <Button disabled={submitting} onClick={handleSubmit} className="w-full sm:w-auto h-11 sm:h-10 text-sm font-medium">
          {submitting ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" />Отправка...</>) : 'Отправить заявку'}
        </Button>
      </div>
    </div>
  );
}

/* ── Main Profile Page ── */
export default function ProfilePage() {
  const { user, setAuthUser, logout } = useAuth();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const { businessState, setBusinessState } = useBusinessState();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isRejectedEditing, setIsRejectedEditing] = useState(false);

  const email = user?.email || '';

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setFirstName(user?.name?.split(' ')[0] || '');
    setLastName(user?.name?.split(' ').slice(1).join(' ') || '');
    setPhoneNumber(user?.phone || '');
  }, [user?.name, user?.phone]);

  const handlePhoneChange = (raw: string) => {
    setPhoneNumber(formatPhone(raw));
    setPhoneError('');
  };

  const handleSave = () => {
    if (phoneNumber && !isValidPhone(phoneNumber)) {
      setPhoneError('Введите корректный номер телефона');
      return;
    }
    const newName = [firstName, lastName].filter(Boolean).join(' ');
    if (user) setAuthUser({ ...user, name: newName, phone: phoneNumber || undefined });
    setIsEditing(false);
    setPhoneError('');
    toast({ title: 'Профиль обновлен', description: 'Ваши данные успешно сохранены' });
  };

  const handleCancel = () => {
    setFirstName(user?.name?.split(' ')[0] || '');
    setLastName(user?.name?.split(' ').slice(1).join(' ') || '');
    setPhoneNumber(user?.phone || '');
    setPhoneError('');
    setIsEditing(false);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleRejectedResubmit = () => {
    setBusinessState('pending');
    setIsRejectedEditing(false);
  };

  if (isPageLoading) return <PageSkeleton cards={3} />;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Personal data ── */}
      <Card>
        <CardContent className="pt-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Личные данные</h2>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 gap-1.5 text-muted-foreground hover:text-foreground px-2.5">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          {isEditing ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Введите имя" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Введите фамилию" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Input id="phone" value={phoneNumber} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="+7 (___) ___-__-__" inputMode="tel" maxLength={18} className={cn(phoneError && 'border-destructive')} />
                    {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Электронная почта</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={email} disabled className="bg-muted" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 w-full mt-6">
                <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto h-11 sm:h-10 text-sm font-medium">Отмена</Button>
                <Button onClick={handleSave} className="w-full sm:w-auto h-11 sm:h-10 text-sm font-medium">Сохранить</Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Имя</p>
                  <p className="font-medium">{firstName || <span className="text-muted-foreground italic">Не указано</span>}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Фамилия</p>
                  <p className="font-medium">{lastName || <span className="text-muted-foreground italic">Не указано</span>}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Телефон</p>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {phoneNumber || <span className="text-muted-foreground italic">Не указано</span>}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Электронная почта</p>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {email || <span className="text-muted-foreground italic">Не указано</span>}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Business requisites section ── */}
      {(businessState === 'pending' || businessState === 'active' || businessState === 'rejected') && (
        <Card>
          <CardHeader className="pb-4">
            <div className="text-base font-semibold">Заявка на бизнес-профиль</div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* ── Pending ── */}
            {businessState === 'pending' && (
              <div className="space-y-2">
                <p className="font-medium text-foreground">ООО &quot;Заряд Плюс&quot;</p>
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>Заявка в работе. Ожидаем ответ от банка.</span>
                </div>
              </div>
            )}

            {/* ── Active ── */}
            {businessState === 'active' && (
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">ООО &quot;Заряд Плюс&quot;</p>
                  <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  ИНН: 7705123456 &middot; КПП: 770501001 &middot; ОГРН: 1207700123456
                </p>
              </div>
            )}

            {/* ── Rejected ── */}
            {businessState === 'rejected' && (
              <div className="space-y-5">
                <div className="rounded-xl border border-destructive/15 bg-destructive/[0.03] p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                    <span className="text-sm font-medium text-destructive">Заявка отклонена</span>
                  </div>
                  <div className="space-y-1 pl-6">
                    <p className="text-sm font-medium text-foreground">ООО &quot;Заряд Плюс&quot;</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Здесь будет ответ от Точки для клиента
                    </p>
                  </div>
                </div>

                {!isRejectedEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-sm font-medium"
                    onClick={() => setIsRejectedEditing(true)}
                  >
                    Редактировать заявку
                  </Button>
                ) : (
                  <RejectedEditForm
                    onSubmitted={handleRejectedResubmit}
                    onCancel={() => setIsRejectedEditing(false)}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Logout ── */}
      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive text-sm font-medium">
              Выйти
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Выйти из аккаунта?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="w-full sm:w-auto h-11 sm:h-10">Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="w-full sm:w-auto h-11 sm:h-10 font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Выйти
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

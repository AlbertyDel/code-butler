import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Clock, Loader2, ShieldCheck, MapPin, Pencil, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useBusinessState } from '@/contexts/BusinessStateContext';
import { HeroSection } from '@/components/business-profile/HeroSection';
import { HowItWorksSection } from '@/components/business-profile/HowItWorksSection';
import { BenefitsSection } from '@/components/business-profile/BenefitsSection';

type LegalTab = 'ooo' | 'ip' | 'sz';

const INN_MAX: Record<LegalTab, number> = { ooo: 10, ip: 12, sz: 12 };

const UNIFIED_ERROR = 'ИНН не найден. Проверьте данные.';

type MockResult = {
  type: 'success' | 'error';
  title?: string;
  subtitle?: string;
  text: string;
  autoAddress?: string;
};

const MOCK_DATA: Record<LegalTab, Record<string, MockResult>> = {
  ooo: {
    '1234567890': {
      type: 'success',
      title: 'ООО "Заряд Плюс"',
      subtitle: 'ИНН: 1234567890 \u2022 КПП: 770501001 \u2022 ОГРН: 1127746543210',
      text: '',
    },
  },
  ip: {
    '123456789012': {
      type: 'success',
      title: 'ИП Петров Иван Сергеевич',
      subtitle: 'ИНН: 123456789012 \u2022 ОГРНИП: 312774654321012',
      text: '',
      autoAddress: 'г. Москва, ул. Примерная, д. 1',
    },
  },
  sz: {
    '987654321098': {
      type: 'success',
      title: 'Петров Иван Сергеевич (НПД)',
      subtitle: 'ИНН: 987654321098',
      text: '',
      autoAddress: 'г. Москва, ул. Примерная, д. 1',
    },
  },
};

function getFeedback(tab: LegalTab, inn: string, maxLen: number): MockResult | null {
  if (inn.length !== maxLen) return null;
  const tabData = MOCK_DATA[tab];
  if (tabData[inn]) return tabData[inn];
  return { type: 'error', text: UNIFIED_ERROR };
}

function PendingCard() {
  return (
    <Card className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        <Clock className="h-12 w-12 text-amber-500 animate-pulse" />
        <h2 className="text-xl font-semibold">Заявка в обработке</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Мы передали данные в банк. Обычно проверка занимает 1-2 рабочих дня. Мы уведомим вас о результате.
        </p>
      </CardContent>
    </Card>
  );
}

export default function BusinessProfilePage() {
  const { businessState, setBusinessState } = useBusinessState();
  const navigate = useNavigate();

  const [tab, setTab] = useState<LegalTab>('ooo');
  const [inn, setInn] = useState('');
  const [address, setAddress] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [searching, setSearching] = useState(false);
  const [visibleFeedback, setVisibleFeedback] = useState<MockResult | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isRejectedEditing, setIsRejectedEditing] = useState(false);
  const innRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Guard: redirect if not in promo or rejected state
  useEffect(() => {
    if (businessState !== 'promo' && businessState !== 'rejected') {
      navigate('/profile', { replace: true });
    }
  }, [businessState, navigate]);

  // Pre-fill fields when in rejected state
  useEffect(() => {
    if (businessState === 'rejected') {
      setTab('ooo');
      setInn('1234567890');
      setAgreed(true);
      setIsRejectedEditing(false);
    }
  }, [businessState]);

  const maxLen = INN_MAX[tab];
  const hasError = visibleFeedback?.type === 'error';
  const canSubmit = inn.length === maxLen && agreed && !submitting && !searching && visibleFeedback?.type === 'success';
  const needsAddress = tab === 'ip' || tab === 'sz';

  const triggerShake = () => {
    setShaking(true);
    if (window.navigator?.vibrate) window.navigator.vibrate(50);
    setTimeout(() => setShaking(false), 400);
  };

  // Simulate search when INN reaches full length
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }

    setVisibleFeedback(null);

    if (inn.length === maxLen) {
      setSearching(true);
      searchTimerRef.current = setTimeout(() => {
        const result = getFeedback(tab, inn, maxLen);
        setVisibleFeedback(result);
        setSearching(false);
        if (result?.type === 'error') {
          triggerShake();
        }
        if (result?.type === 'success' && result.autoAddress) {
          setAddress(result.autoAddress);
        }
      }, 1000);
    } else {
      setSearching(false);
    }

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inn, tab, maxLen]);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (businessState !== 'promo' && businessState !== 'rejected') return null;
  if (submitted) return <PendingCard />;

  const isReadOnly = businessState === 'rejected' && !isRejectedEditing;

  const handleInnChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length > maxLen) {
      triggerShake();
      return;
    }
    setInn(digits);
    setFieldErrors((prev) => { const { inn, ...rest } = prev; return rest; });
  };

  const handleTabChange = (v: string) => {
    setTab(v as LegalTab);
    setInn('');
    setAddress('');
    setAgreed(false);
    setVisibleFeedback(null);
    setSearching(false);
    setFieldErrors({});
  };

  const handleSubmit = async () => {
    const errors: Record<string, string> = {};

    if (inn.length === 0) {
      errors.inn = 'Поле обязательно для заполнения';
    } else if (inn.length !== maxLen) {
      errors.inn = `ИНН должен содержать ${maxLen} цифр`;
    } else if (visibleFeedback?.type === 'error' || (!visibleFeedback && !searching)) {
      errors.inn = 'ИНН не найден';
    }

    if (needsAddress && !address.trim()) {
      errors.address = 'Укажите адрес регистрации';
    }

    if (!agreed) {
      errors.agreed = 'Необходимо согласие';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitting(false);
    setSubmitted(true);
    setBusinessState('pending');
    navigate('/profile');
  };

  return (
    <div className="mt-4 sm:mt-8 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {businessState === 'promo' && (
        <>
          <HeroSection onActivate={scrollToForm} />
          <HowItWorksSection />
          <BenefitsSection />
        </>
      )}

      {businessState === 'rejected' && (
        <div className="max-w-2xl mx-auto">
          <Alert className="border-destructive/30 bg-destructive/5">
            <XCircle className="h-5 w-5 text-destructive" />
            <AlertDescription className="ml-2">
              <p className="font-semibold text-foreground">Заявка отклонена</p>
              <p className="text-sm text-muted-foreground mt-1">
                Здесь будет ответ от Точки для клиента
              </p>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div ref={formRef} className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Бизнес-профиль</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Security info banner */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-blue-700">
                Для приема платежей и вывода средств мы бесплатно откроем для вас виртуальный счет в ПАО Банк Точка.
              </p>
            </div>

            {/* Segmented control */}
            <Tabs value={tab} onValueChange={isReadOnly ? undefined : handleTabChange}>
              <TabsList className="w-full h-auto flex flex-col sm:flex-row bg-muted/60 p-1 gap-1">
                <TabsTrigger
                  value="ooo"
                  disabled={isReadOnly}
                  className="w-full py-2.5 text-xs sm:text-sm whitespace-normal text-center data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Юр. лицо (ООО)
                </TabsTrigger>
                <TabsTrigger
                  value="ip"
                  disabled={isReadOnly}
                  className="w-full py-2.5 text-xs sm:text-sm whitespace-normal text-center data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  ИП
                </TabsTrigger>
                <TabsTrigger
                  value="sz"
                  disabled={isReadOnly}
                  className="w-full py-2.5 text-xs sm:text-sm whitespace-normal text-center data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Самозанятый
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* INN */}
            <div className="space-y-2">
              <Label>ИНН</Label>
              <div className="relative">
                <Input
                  ref={innRef}
                  value={inn}
                  onChange={(e) => handleInnChange(e.target.value)}
                  placeholder={`${maxLen} цифр`}
                  maxLength={maxLen + 1}
                  inputMode="numeric"
                  disabled={isReadOnly}
                  className={cn(
                    'pr-10',
                    shaking && 'animate-shake',
                    isReadOnly && 'bg-muted',
                    (hasError || fieldErrors.inn) && 'border-destructive focus-visible:ring-destructive'
                  )}
                />
                {searching && (
                  <span className="absolute right-3 top-0 bottom-0 flex items-center pointer-events-none">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </span>
                )}
              </div>

              {/* Feedback card */}
              {visibleFeedback && (
                <div
                  className={cn(
                    'rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200',
                    visibleFeedback.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200'
                      : 'bg-destructive/5 border border-destructive/20'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {visibleFeedback.type === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      {visibleFeedback.title && (
                        <p className="font-semibold text-foreground">{visibleFeedback.title}</p>
                      )}
                      {visibleFeedback.subtitle && (
                        <p className="text-xs text-muted-foreground mt-0.5">{visibleFeedback.subtitle}</p>
                      )}
                      {visibleFeedback.text && (
                        <p className={cn(
                          'text-sm',
                          visibleFeedback.type === 'error' ? 'text-destructive' : 'text-foreground'
                        )}>
                          {visibleFeedback.text}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {fieldErrors.inn && !visibleFeedback && (
                <p className="text-destructive text-xs mt-1">{fieldErrors.inn}</p>
              )}
            </div>

            {/* Address for IP / SZ */}
            {needsAddress && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <Label>Адрес регистрации</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-0 bottom-0 h-full w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={isReadOnly}
                    className={cn("pl-9", isReadOnly && "bg-muted", fieldErrors.address && "border-destructive focus-visible:ring-destructive")}
                  />
                </div>
                {fieldErrors.address && (
                  <p className="text-destructive text-xs mt-1">{fieldErrors.address}</p>
                )}
              </div>
            )}

            {/* Consent checkbox */}
            <label className={cn("flex items-start gap-3", isReadOnly ? 'cursor-default' : 'cursor-pointer')}>
              <Checkbox
                checked={agreed}
                disabled={isReadOnly}
                onCheckedChange={(v) => {
                  setAgreed(v === true);
                  if (v === true) setFieldErrors((prev) => { const { agreed, ...rest } = prev; return rest; });
                }}
                className={cn("mt-0.5 h-5 w-5 rounded-[4px] border-2", fieldErrors.agreed && "border-destructive")}
              />
              <span className="text-sm text-muted-foreground leading-snug">
                Я согласен на обработку персональных данных и передачу информации в ПАО Банк Точка
              </span>
            </label>
            {fieldErrors.agreed && (
              <p className="text-destructive text-xs -mt-4 ml-8">{fieldErrors.agreed}</p>
            )}

            {/* Submit */}
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              size="lg"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Отправка...
                </>
              ) : (
                'Отправить заявку'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
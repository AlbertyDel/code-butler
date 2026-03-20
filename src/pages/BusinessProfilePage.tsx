import { useState, useRef, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Clock, Loader2, ShieldCheck, MapPin } from 'lucide-react';
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
    '0000000000': {
      type: 'error',
      text: 'Компания не найдена. Проверьте ИНН',
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
    '000000000000': {
      type: 'error',
      text: 'Предприниматель не найден. Проверьте ИНН',
    },
  },
  sz: {
    '987654321098': {
      type: 'success',
      title: 'Петров Иван Сергеевич (НПД)',
      subtitle: 'ИНН: 987654321098 \u2022 Статус: Действующий',
      text: '',
      autoAddress: 'г. Москва, ул. Примерная, д. 1',
    },
    '000000000000': {
      type: 'error',
      text: 'Статус самозанятого не подтвержден в ФНС',
    },
  },
};

function getFeedback(tab: LegalTab, inn: string, maxLen: number): MockResult | null {
  if (inn.length !== maxLen) return null;
  const tabData = MOCK_DATA[tab];
  if (tabData[inn]) return tabData[inn];
  return { type: 'error', text: 'Неверный ИНН' };
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
  const [tab, setTab] = useState<LegalTab>('ooo');
  const [inn, setInn] = useState('');
  const [address, setAddress] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shaking, setShaking] = useState(false);
  const innRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const maxLen = INN_MAX[tab];
  const feedback = getFeedback(tab, inn, maxLen);
  const isDefaultError = feedback?.type === 'error' && feedback.text === 'Неверный ИНН';
  const canSubmit = inn.length === maxLen && agreed && !submitting && feedback?.type !== 'error';
  const needsAddress = tab === 'ip' || tab === 'sz';

  const triggerShake = () => {
    setShaking(true);
    if (window.navigator?.vibrate) window.navigator.vibrate(50);
    setTimeout(() => setShaking(false), 400);
  };

  // Auto-fill address when feedback has autoAddress
  useEffect(() => {
    if (feedback?.type === 'success' && feedback.autoAddress) {
      setAddress(feedback.autoAddress);
    }
  }, [feedback?.type, feedback?.autoAddress]);

  // Shake on default error
  useEffect(() => {
    if (isDefaultError) {
      triggerShake();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDefaultError, inn]);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (businessState !== 'promo') return null;
  if (submitted) return <PendingCard />;

  const handleInnChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length > maxLen) {
      triggerShake();
      return;
    }
    setInn(digits);
  };

  const handleTabChange = (v: string) => {
    setTab(v as LegalTab);
    setInn('');
    setAddress('');
    setAgreed(false);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitting(false);
    setSubmitted(true);
    setBusinessState('pending');
  };

  return (
    <div className="mt-8 space-y-8 animate-in fade-in duration-300">
      <HeroSection onActivate={scrollToForm} />
      <HowItWorksSection />
      <BenefitsSection />

      <div ref={formRef} className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Бизнес-профиль</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Security info banner */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                Для приема платежей и вывода средств мы бесплатно откроем для вас виртуальный счет в ПАО Банк Точка.
              </p>
            </div>

            {/* Segmented control */}
            <Tabs value={tab} onValueChange={handleTabChange}>
              <TabsList className="w-full bg-muted/60 p-1">
                <TabsTrigger
                  value="ooo"
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Юр. лицо (ООО)
                </TabsTrigger>
                <TabsTrigger
                  value="ip"
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  ИП
                </TabsTrigger>
                <TabsTrigger
                  value="sz"
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm"
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
                  className={cn(
                    'pr-16',
                    shaking && 'animate-shake',
                    feedback?.type === 'error' && 'border-destructive'
                  )}
                />
                <span className="absolute right-3 top-0 bottom-0 flex items-center text-xs text-muted-foreground pointer-events-none tabular-nums">
                  {inn.length}/{maxLen}
                </span>
              </div>

              {/* Feedback card */}
              {feedback && (
                <div
                  className={cn(
                    'rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200',
                    feedback.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200'
                      : 'bg-destructive/5 border border-destructive/20'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {feedback.type === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      {feedback.title && (
                        <p className="font-semibold text-foreground">{feedback.title}</p>
                      )}
                      {feedback.subtitle && (
                        <p className="text-xs text-muted-foreground mt-0.5">{feedback.subtitle}</p>
                      )}
                      {feedback.text && (
                        <p className={cn(
                          'text-sm',
                          feedback.type === 'error' ? 'text-destructive' : 'text-foreground'
                        )}>
                          {feedback.text}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
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
                    placeholder="г. Москва, ул. Примерная, д. 1"
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            {/* Consent checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={agreed}
                onCheckedChange={(v) => setAgreed(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm text-muted-foreground leading-snug">
                Я согласен на обработку персональных данных и передачу информации в{' '}
                <span className="underline underline-offset-2 decoration-muted-foreground/40">
                  ПАО Банк Точка
                </span>
              </span>
            </label>

            {/* Submit */}
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              size="lg"
              disabled={!canSubmit}
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

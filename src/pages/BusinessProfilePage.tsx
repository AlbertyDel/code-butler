import { useState, useRef } from 'react';
import { Check, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useBusinessState } from '@/contexts/BusinessStateContext';
import { BenefitsSection } from '@/components/business-profile/BenefitsSection';

type LegalTab = 'ooo' | 'ip' | 'sz';

const INN_MAX: Record<LegalTab, number> = { ooo: 10, ip: 12, sz: 12 };

const MOCK_RESULT: Record<string, { type: 'success' | 'error'; text: string }> = {
  '1234567890': { type: 'success', text: 'ООО "Заряд Плюс"' },
  '0000000000': { type: 'error', text: 'Компания не найдена' },
};

/* Pending state — shown after successful submit */
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

  if (businessState !== 'promo') return null;
  if (submitted) return <PendingCard />;

  const maxLen = INN_MAX[tab];
  const feedback = MOCK_RESULT[inn] || null;
  const canSubmit = inn.length === maxLen && agreed && !submitting && feedback?.type !== 'error';

  const handleInnChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length > maxLen) {
      // shake + vibrate
      setShaking(true);
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
      setTimeout(() => setShaking(false), 400);
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

  const needsAddress = tab === 'ip' || tab === 'sz';

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <BenefitsSection />
      <Card className="animate-in fade-in duration-300">
        <CardHeader>
        <CardTitle>Бизнес-профиль</CardTitle>
        <p className="text-sm text-muted-foreground">
          Для приема платежей и вывода средств мы бесплатно откроем для вас виртуальный счет в банке Точка.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Segmented control */}
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="w-full">
            <TabsTrigger value="ooo" className="flex-1">Юр. лицо (ООО)</TabsTrigger>
            <TabsTrigger value="ip" className="flex-1">ИП</TabsTrigger>
            <TabsTrigger value="sz" className="flex-1">Самозанятый</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* INN */}
        <div className="space-y-2">
          <Label>ИНН</Label>
          <Input
            ref={innRef}
            value={inn}
            onChange={(e) => handleInnChange(e.target.value)}
            placeholder={`${maxLen} цифр`}
            maxLength={maxLen + 1}
            inputMode="numeric"
            className={cn(shaking && 'animate-shake')}
          />

          {/* Feedback zone */}
          {feedback && (
            <div
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm animate-in fade-in slide-in-from-top-1 duration-200',
                feedback.type === 'success'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              {feedback.type === 'success' ? (
                <Check className="h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              )}
              {feedback.text}
            </div>
          )}
        </div>

        {/* Address for IP / SZ */}
        {needsAddress && (
          <div className="space-y-2 animate-in fade-in duration-200">
            <Label>Адрес регистрации</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="г. Москва, ул. Примерная, д. 1"
            />
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
            Я согласен на обработку персональных данных и передачу информации в ПАО Банк Точка
          </span>
        </label>

        {/* Submit */}
        <Button
          className="w-full"
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
  );
}

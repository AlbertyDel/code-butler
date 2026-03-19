import { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Building2, User, Briefcase, Check, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { DigitInput } from './DigitInput';
import { AddressCombobox } from './AddressCombobox';
import { registrationSchema, type RegistrationFormData, type LegalType } from './schemas';
import { cn } from '@/lib/utils';

const LEGAL_TYPES: { value: LegalType; label: string; icon: typeof Building2 }[] = [
  { value: 'ooo', label: 'Юр. лицо (ООО)', icon: Building2 },
  { value: 'ip', label: 'ИП', icon: Briefcase },
  { value: 'selfemployed', label: 'Самозанятый', icon: User },
];

/* ───── INN Feedback ───── */
function InnFeedback({ inn, requiredLength }: { inn: string; requiredLength: number }) {
  if (inn.length !== requiredLength) return null;

  if (inn === '1234567890' || inn === '123456789012') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50 p-3 animate-in fade-in slide-in-from-top-2 duration-300">
        <Check className="h-5 w-5 shrink-0 text-emerald-500" />
        <span className="text-sm font-medium text-emerald-700">ООО Заряд Плюс</span>
      </div>
    );
  }

  const allZeros = requiredLength === 10 ? '0000000000' : '000000000000';
  if (inn === allZeros) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 animate-in fade-in slide-in-from-top-2 duration-300">
        <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
        <span className="text-sm font-medium text-destructive">Компания не найдена</span>
      </div>
    );
  }

  return null;
}

/* ───── Success state ───── */
function SubmittedState() {
  return (
    <Card className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardContent className="flex flex-col items-center gap-4 py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Clock className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">Заявка в обработке...</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Мы проверяем ваши данные. Обычно это занимает не более 1 рабочего дня. Вы получите уведомление о результате.
        </p>
      </CardContent>
    </Card>
  );
}

/* ───── Main Form ───── */
export function RegistrationForm() {
  const [legalType, setLegalType] = useState<LegalType>('ooo');
  const [submitted, setSubmitted] = useState(false);
  const [shaking, setShaking] = useState(false);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      legalType: 'ooo',
      inn: '',
      consent: false,
    } as any,
  });

  const inn = form.watch('inn') || '';
  const requiredLength = legalType === 'ooo' ? 10 : 12;

  // Shake on overflow
  const handleInnChange = useCallback((v: string) => {
    if (v.length > requiredLength) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }
    form.setValue('inn', v, { shouldValidate: form.formState.isSubmitted });
  }, [requiredLength, form]);

  const handleTypeChange = (value: string) => {
    const newType = value as LegalType;
    setLegalType(newType);
    form.reset({ legalType: newType, inn: '', consent: false } as any);
  };

  const onSubmit = async (data: RegistrationFormData) => {
    console.log('Submitted:', data);
    await new Promise(r => setTimeout(r, 2000));
    setSubmitted(true);
  };

  if (submitted) return <SubmittedState />;

  const errors = form.formState.errors;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Регистрация бизнеса</CardTitle>
        <CardDescription>
          Заполните данные для проверки юридического лица и подключения к платформе.
        </CardDescription>
        <p className="text-sm text-muted-foreground pt-2">
          Для приема платежей и вывода средств мы бесплатно откроем для вас виртуальный субсчет в банке Точка.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Legal type selector */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Форма собственности</Label>
            <RadioGroup value={legalType} onValueChange={handleTypeChange} className="grid grid-cols-3 gap-3">
              {LEGAL_TYPES.map(({ value, label, icon: Icon }) => (
                <label
                  key={value}
                  className={cn(
                    'relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 cursor-pointer transition-all duration-200',
                    'hover:border-primary/50 hover:bg-accent/50',
                    legalType === value
                      ? 'border-primary bg-accent shadow-sm'
                      : 'border-border bg-card'
                  )}
                >
                  <RadioGroupItem value={value} className="sr-only" />
                  <Icon className={cn(
                    'h-6 w-6 transition-colors',
                    legalType === value ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <span className={cn(
                    'text-sm font-medium text-center transition-colors',
                    legalType === value ? 'text-foreground' : 'text-muted-foreground'
                  )}>{label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Dynamic fields */}
          <div key={legalType} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-2">
              <Label>ИНН</Label>
              <div className={cn(shaking && 'animate-shake')}>
                <DigitInput
                  value={inn}
                  onChange={handleInnChange}
                  placeholder={`${requiredLength} цифр`}
                  maxLength={requiredLength}
                  error={errors.inn?.message as string}
                />
              </div>
            </div>

            <InnFeedback inn={inn} requiredLength={requiredLength} />

            {legalType !== 'ooo' && (
              <div className="space-y-2">
                <Label>Адрес регистрации</Label>
                <AddressCombobox
                  value={form.watch('address') || ''}
                  onChange={(v) => form.setValue('address' as any, v, { shouldValidate: form.formState.isSubmitted })}
                  error={(errors as any).address?.message as string}
                />
              </div>
            )}
          </div>

          {/* Consent checkbox */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={form.watch('consent') as any}
                onCheckedChange={(checked) => form.setValue('consent' as any, checked === true, { shouldValidate: form.formState.isSubmitted })}
                className={cn(errors.consent && 'border-destructive')}
              />
              <label htmlFor="consent" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                Я согласен на обработку персональных данных и передачу информации в ПАО Банк Точка
              </label>
            </div>
            {errors.consent && <p className="text-sm text-destructive">{errors.consent.message as string}</p>}
          </div>

          {/* Submit button */}
          <Button type="submit" className="w-full rounded-xl" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Отправка...
              </>
            ) : (
              'Отправить заявку'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

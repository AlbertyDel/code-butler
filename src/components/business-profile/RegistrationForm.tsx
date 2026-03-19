import { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Building2, User, Briefcase, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DigitInput } from './DigitInput';
import { AddressCombobox } from './AddressCombobox';
import { registrationSchema, type RegistrationFormData, type LegalType } from './schemas';
import { cn } from '@/lib/utils';

const MOCK_COMPANY_OOO = { name: 'ООО "АЛЬФА ИНТЕГРАЦИЯ"', kpp: '770501001', ogrn: '1207700123456' };
const MOCK_COMPANY_IP = { name: 'Иванов Иван Иванович', ogrnip: '312774600000012' };
const ALL_ZEROS_10 = '0000000000';
const ALL_ZEROS_12 = '000000000000';

const LEGAL_TYPES: { value: LegalType; label: string; icon: typeof Building2 }[] = [
  { value: 'ooo', label: 'Юр. лицо (ООО)', icon: Building2 },
  { value: 'ip', label: 'ИП', icon: Briefcase },
  { value: 'selfemployed', label: 'Самозанятый', icon: User },
];

type CompanyResult = { name: string; kpp?: string; ogrn?: string; ogrnip?: string };

function useInnLookup(requiredLength: number) {
  const [companyData, setCompanyData] = useState<CompanyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const onInnChange = useCallback((value: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const allZeros = requiredLength === 10 ? ALL_ZEROS_10 : ALL_ZEROS_12;

    if (value.length < requiredLength) {
      setCompanyData(null); setLoading(false); setNotFound(false);
      return;
    }
    if (value === allZeros) {
      setCompanyData(null); setLoading(false); setNotFound(true);
      return;
    }
    if (value.length === requiredLength) {
      setLoading(true); setNotFound(false);
      const mock = requiredLength === 10 ? MOCK_COMPANY_OOO : MOCK_COMPANY_IP;
      timerRef.current = setTimeout(() => { setCompanyData(mock); setLoading(false); }, 1000);
    }
  }, [requiredLength]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCompanyData(null); setLoading(false); setNotFound(false);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { companyData, loading, notFound, onInnChange, reset };
}

/* ───── Summary Card ───── */
function CompanySummaryCard({ data, type }: { data: CompanyResult; type: 'ooo' | 'ip' }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-emerald-500" />
      <div className="min-w-0">
        <p className="font-medium text-foreground truncate">{data.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {type === 'ooo'
            ? `КПП: ${data.kpp} • ОГРН: ${data.ogrn}`
            : `ОГРНИП: ${data.ogrnip}`}
        </p>
      </div>
    </div>
  );
}

/* ───── Dynamic Fields ───── */
function OooFields({ form }: { form: ReturnType<typeof useForm<any>> }) {
  const { setValue, watch, formState: { errors } } = form;
  const inn = watch('inn') || '';
  const { companyData, loading, notFound, onInnChange } = useInnLookup(10);

  useEffect(() => { onInnChange(inn); }, [inn, onInnChange]);

  return (
    <>
      <div className="space-y-2">
        <Label>ИНН</Label>
        <DigitInput value={inn} onChange={(v) => setValue('inn', v)} placeholder="10 цифр" maxLength={10} showSpinner={loading} error={notFound ? 'Компания с таким ИНН не найдена' : (errors.inn?.message as string)} />
      </div>
      {companyData && <CompanySummaryCard data={companyData} type="ooo" />}
    </>
  );
}

function IpFields({ form }: { form: ReturnType<typeof useForm<any>> }) {
  const { setValue, watch, formState: { errors } } = form;
  const inn = watch('inn') || '';
  const { companyData, loading, notFound, onInnChange } = useInnLookup(12);

  useEffect(() => { onInnChange(inn); }, [inn, onInnChange]);

  return (
    <>
      <div className="space-y-2">
        <Label>ИНН</Label>
        <DigitInput value={inn} onChange={(v) => setValue('inn', v)} placeholder="12 цифр" maxLength={12} showSpinner={loading} error={notFound ? 'ИП с таким ИНН не найден' : (errors.inn?.message as string)} />
      </div>
      {companyData && <CompanySummaryCard data={companyData} type="ip" />}
      <div className="space-y-2">
        <Label>Адрес регистрации</Label>
        <AddressCombobox value={watch('address') || ''} onChange={(v) => setValue('address', v, { shouldValidate: true })} error={errors.address?.message as string} />
      </div>
    </>
  );
}

function SelfEmployedFields({ form }: { form: ReturnType<typeof useForm<any>> }) {
  const { setValue, watch, formState: { errors } } = form;

  return (
    <>
      <div className="space-y-2">
        <Label>ИНН</Label>
        <DigitInput value={watch('inn') || ''} onChange={(v) => setValue('inn', v)} placeholder="12 цифр" maxLength={12} error={errors.inn?.message as string} />
      </div>
      <div className="space-y-2">
        <Label>Адрес регистрации</Label>
        <AddressCombobox value={watch('address') || ''} onChange={(v) => setValue('address', v, { shouldValidate: true })} error={errors.address?.message as string} />
      </div>
    </>
  );
}

/* ───── Main Form ───── */
export function RegistrationForm() {
  const [legalType, setLegalType] = useState<LegalType>('ooo');

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      legalType: 'ooo',
      inn: '',
      agreed: false as any,
    },
  });

  const agreed = form.watch('agreed');

  const handleTypeChange = (value: string) => {
    const newType = value as LegalType;
    setLegalType(newType);
    form.reset({ legalType: newType, inn: '', agreed: false as any } as any);
  };

  const onSubmit = async (data: RegistrationFormData) => {
    console.log('Submitted:', data);
    await new Promise(r => setTimeout(r, 2000));
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Регистрация бизнеса</CardTitle>
        <p className="text-sm text-muted-foreground">
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
            {legalType === 'ooo' && <OooFields form={form} />}
            {legalType === 'ip' && <IpFields form={form} />}
            {legalType === 'selfemployed' && <SelfEmployedFields form={form} />}
          </div>

          {/* Consent checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={agreed === true}
              onCheckedChange={(v) => form.setValue('agreed', (v === true) as any, { shouldValidate: true })}
              className="mt-0.5"
            />
            <span className="text-sm text-muted-foreground leading-snug">
              Я согласен на обработку персональных данных и передачу информации в ПАО Банк Точка
            </span>
          </label>
          {form.formState.errors.agreed && (
            <p className="text-sm text-destructive -mt-4">{form.formState.errors.agreed.message as string}</p>
          )}

          {/* Submit */}
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

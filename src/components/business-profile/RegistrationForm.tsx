import { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DigitInput } from './DigitInput';
import { AddressCombobox } from './AddressCombobox';
import {
  oooSchema, ipSchema, selfEmployedSchema,
  type OooFormData, type IpFormData, type SelfEmployedFormData,
} from './schemas';

const MOCK_COMPANY = { name: 'ООО «Электродрайв»', kpp: '770401001', ogrn: '1157746123456' };
const ALL_ZEROS_10 = '0000000000';
const ALL_ZEROS_12 = '000000000000';

function useInnLookup(requiredLength: number) {
  const [companyData, setCompanyData] = useState<{ name: string; kpp: string; ogrn: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const onInnChange = useCallback((value: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const allZeros = requiredLength === 10 ? ALL_ZEROS_10 : ALL_ZEROS_12;

    if (value.length < requiredLength) {
      setCompanyData(null);
      setLoading(false);
      setNotFound(false);
      return;
    }

    if (value === allZeros) {
      setCompanyData(null);
      setLoading(false);
      setNotFound(true);
      return;
    }

    if (value.length === requiredLength) {
      setLoading(true);
      setNotFound(false);
      timerRef.current = setTimeout(() => {
        setCompanyData(MOCK_COMPANY);
        setLoading(false);
      }, 1000);
    }
  }, [requiredLength]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { companyData, loading, notFound, onInnChange };
}

/* ───── OOO Tab ───── */
function OooTab() {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<OooFormData>({
    resolver: zodResolver(oooSchema), defaultValues: { inn: '', account: '', bik: '', companyName: '', kpp: '', ogrn: '' },
  });
  const inn = watch('inn');
  const { companyData, loading, notFound, onInnChange } = useInnLookup(10);

  useEffect(() => { onInnChange(inn); }, [inn, onInnChange]);
  useEffect(() => {
    setValue('companyName', companyData?.name ?? '');
    setValue('kpp', companyData?.kpp ?? '');
    setValue('ogrn', companyData?.ogrn ?? '');
  }, [companyData, setValue]);

  const onSubmit = async (_data: OooFormData) => { await new Promise(r => setTimeout(r, 2000)); };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>ИНН</Label>
        <DigitInput
          value={inn}
          onChange={(v) => setValue('inn', v, { shouldValidate: false })}
          placeholder="10 цифр"
          maxLength={10}
          showSpinner={loading}
          error={notFound ? 'Компания с таким ИНН не найдена' : errors.inn?.message}
        />
        <p className="text-xs text-muted-foreground">Название, КПП и ОГРН заполнятся автоматически</p>
      </div>
      <div className="space-y-2">
        <Label>Название компании</Label>
        <Input disabled value={watch('companyName')} placeholder="Заполнится автоматически" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>КПП</Label>
          <Input disabled value={watch('kpp')} placeholder="Автоматически" />
        </div>
        <div className="space-y-2">
          <Label>ОГРН</Label>
          <Input disabled value={watch('ogrn')} placeholder="Автоматически" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Расчётный счёт</Label>
        <DigitInput value={watch('account')} onChange={(v) => setValue('account', v)} placeholder="20 цифр" maxLength={20} error={errors.account?.message} />
      </div>
      <div className="space-y-2">
        <Label>БИК банка</Label>
        <DigitInput value={watch('bik')} onChange={(v) => setValue('bik', v)} placeholder="9 цифр" maxLength={9} error={errors.bik?.message} />
      </div>
      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}

/* ───── IP Tab ───── */
function IpTab() {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<IpFormData>({
    resolver: zodResolver(ipSchema), defaultValues: { inn: '', fullName: '', account: '', bik: '' },
  });
  const inn = watch('inn');
  const { loading, notFound, onInnChange } = useInnLookup(12);

  useEffect(() => { onInnChange(inn); }, [inn, onInnChange]);

  const onSubmit = async (_data: IpFormData) => { await new Promise(r => setTimeout(r, 2000)); };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>ИНН</Label>
        <DigitInput value={inn} onChange={(v) => setValue('inn', v)} placeholder="12 цифр" maxLength={12} showSpinner={loading} error={notFound ? 'ИП с таким ИНН не найден' : errors.inn?.message} />
      </div>
      <div className="space-y-2">
        <Label>ФИО</Label>
        <Input {...register('fullName')} placeholder="Иванов Иван Иванович" className={errors.fullName ? 'border-destructive' : ''} />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Расчётный счёт</Label>
        <DigitInput value={watch('account')} onChange={(v) => setValue('account', v)} placeholder="20 цифр" maxLength={20} error={errors.account?.message} />
      </div>
      <div className="space-y-2">
        <Label>БИК банка</Label>
        <DigitInput value={watch('bik')} onChange={(v) => setValue('bik', v)} placeholder="9 цифр" maxLength={9} error={errors.bik?.message} />
      </div>
      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}

/* ───── Self-Employed Tab ───── */
function SelfEmployedTab() {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<SelfEmployedFormData>({
    resolver: zodResolver(selfEmployedSchema),
    defaultValues: { inn: '', fullName: '', passportSeries: '', passportNumber: '', passportIssuedBy: '', passportDate: '', passportCode: '', address: '', account: '', bik: '' },
  });

  const onSubmit = async (_data: SelfEmployedFormData) => { await new Promise(r => setTimeout(r, 2000)); };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>ИНН</Label>
        <DigitInput value={watch('inn')} onChange={(v) => setValue('inn', v)} placeholder="12 цифр" maxLength={12} error={errors.inn?.message} />
      </div>
      <div className="space-y-2">
        <Label>ФИО</Label>
        <Input {...register('fullName')} placeholder="Иванов Иван Иванович" className={errors.fullName ? 'border-destructive' : ''} />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>
      <div className="space-y-4">
        <Label className="text-base font-semibold">Паспортные данные</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Серия</Label>
            <DigitInput value={watch('passportSeries')} onChange={(v) => setValue('passportSeries', v)} placeholder="4 цифры" maxLength={4} error={errors.passportSeries?.message} />
          </div>
          <div className="space-y-2">
            <Label>Номер</Label>
            <DigitInput value={watch('passportNumber')} onChange={(v) => setValue('passportNumber', v)} placeholder="6 цифр" maxLength={6} error={errors.passportNumber?.message} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Дата выдачи</Label>
          <Input {...register('passportDate')} placeholder="ДД.ММ.ГГГГ" className={errors.passportDate ? 'border-destructive' : ''} />
          {errors.passportDate && <p className="text-sm text-destructive">{errors.passportDate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Кем выдан</Label>
          <Input {...register('passportIssuedBy')} placeholder="Отделение УФМС..." className={errors.passportIssuedBy ? 'border-destructive' : ''} />
          {errors.passportIssuedBy && <p className="text-sm text-destructive">{errors.passportIssuedBy.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Код подразделения</Label>
          <Input {...register('passportCode')} placeholder="XXX-XXX" className={errors.passportCode ? 'border-destructive' : ''} />
          {errors.passportCode && <p className="text-sm text-destructive">{errors.passportCode.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Адрес регистрации</Label>
        <AddressCombobox value={watch('address')} onChange={(v) => setValue('address', v, { shouldValidate: true })} error={errors.address?.message} />
      </div>
      <div className="space-y-2">
        <Label>Расчётный счёт</Label>
        <DigitInput value={watch('account')} onChange={(v) => setValue('account', v)} placeholder="20 цифр" maxLength={20} error={errors.account?.message} />
      </div>
      <div className="space-y-2">
        <Label>БИК банка</Label>
        <DigitInput value={watch('bik')} onChange={(v) => setValue('bik', v)} placeholder="9 цифр" maxLength={9} error={errors.bik?.message} />
      </div>
      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}

/* ───── Submit Button ───── */
function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button type="submit" className="w-full rounded-xl" size="lg" disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Отправка...
        </>
      ) : (
        'Отправить заявку'
      )}
    </Button>
  );
}

/* ───── Main Form ───── */
export function RegistrationForm() {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Регистрация бизнеса</CardTitle>
        <CardDescription>
          Заполните данные для проверки юридического лица и подключения к платформе.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ooo">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="ooo">Юр. лицо (ООО)</TabsTrigger>
            <TabsTrigger value="ip">ИП</TabsTrigger>
            <TabsTrigger value="selfemployed">Самозанятый</TabsTrigger>
          </TabsList>
          <TabsContent value="ooo"><OooTab /></TabsContent>
          <TabsContent value="ip"><IpTab /></TabsContent>
          <TabsContent value="selfemployed"><SelfEmployedTab /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

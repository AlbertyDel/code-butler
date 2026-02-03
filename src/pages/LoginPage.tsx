import { memo } from 'react';
import { IMaskInput } from 'react-imask';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RefreshCw, AlertCircle, Phone } from 'lucide-react';
import { useLogin, type LoginStep } from '@/hooks/useLogin';
import logoCharger from '@/assets/logo-charger.svg';

// Модальное окно "Не приходит СМС"
const LoginHelpDialog = memo(function LoginHelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="link"
          className="text-primary p-0 h-auto"
        >
          Не приходит СМС
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Возможные причины:</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-[auto_1fr] gap-4 mt-4">
          <AlertCircle className="h-7 w-7 text-destructive" />
          <div className="text-sm">
            Вы не сообщили в службу поддержки новый номер телефона и код пришёл на старый.
            <br />
            Обратитесь по номеру{' '}
            <a href="tel:+74991107321" className="text-primary whitespace-nowrap font-medium hover:underline">
              <Phone className="h-3 w-3 inline mr-1" />
            +7 (499) 110-73-21
            </a>
          </div>
          <AlertCircle className="h-7 w-7 text-destructive" />
          <div className="text-sm">
            Проблемы у вашего сотового оператора. Обратитесь в его службу поддержки.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

interface PhoneStepProps {
  phone: string;
  isPhoneValid: boolean;
  isLoading: boolean;
  onPhoneChange: (value: string) => void;
  onPhoneComplete: () => void;
}

const PhoneStep = memo(function PhoneStep({
  phone,
  isPhoneValid,
  isLoading,
  onPhoneChange,
  onPhoneComplete,
}: PhoneStepProps) {
  return (
    <>
      <label className="text-sm text-muted-foreground mb-2">
        Введите номер телефона
      </label>
      <IMaskInput
        mask="+7 (000) 000-00-00"
        placeholder="+7 (___) ___-__-__"
        value={phone}
        unmask={false}
        onAccept={(value) => {
          onPhoneChange(value);
        }}
        onComplete={onPhoneComplete}
        className="flex h-12 w-full rounded-lg border border-input bg-background px-4 py-2 text-center text-lg ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mb-auto md:mb-4"
        inputMode="numeric"
        autoFocus
      />
      <Button 
        type="submit" 
        className="w-full h-12 text-base"
        disabled={!isPhoneValid || isLoading}
      >
        {isLoading ? 'Загрузка...' : 'Продолжить'}
      </Button>
    </>
  );
});

interface SecretStepProps {
  captcha: string | null;
  secret: string;
  isLoading: boolean;
  onSecretChange: (value: string) => void;
  onRefresh: () => void;
  onBack: () => void;
}

const SecretStep = memo(function SecretStep({
  captcha,
  secret,
  isLoading,
  onSecretChange,
  onRefresh,
  onBack,
}: SecretStepProps) {
  if (!captcha) return null;
  
  return (
    <>
      <img 
        src={captcha} 
        alt="Captcha" 
        className="mb-2 w-full md:w-72 rounded-lg"
      />
      <Button
        type="button"
        variant="ghost"
        className="text-primary mb-4"
        disabled={isLoading}
        onClick={onRefresh}
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Обновить символы
      </Button>
      <Input
        value={secret}
        onChange={(e) => onSecretChange(e.target.value)}
        placeholder="Код с картинки"
        className="text-center h-12 text-lg mb-auto md:mb-4"
        required
      />
      <div className="flex gap-2 w-full">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12"
          disabled={isLoading}
          onClick={onBack}
        >
          Назад
        </Button>
        <Button 
          type="submit" 
          className="flex-1 h-12"
          disabled={isLoading}
        >
          {isLoading ? 'Загрузка...' : 'Продолжить'}
        </Button>
      </div>
    </>
  );
});

interface CodeStepProps {
  phone: string;
  code: string;
  isCodeValid: boolean;
  isLoading: boolean;
  countdown: number;
  onCodeChange: (value: string) => void;
  onCodeValidChange: (valid: boolean) => void;
  onChangePhone: () => void;
  onResend: () => void;
}

const CodeStep = memo(function CodeStep({
  phone,
  code,
  isCodeValid,
  isLoading,
  countdown,
  onCodeChange,
  onCodeValidChange,
  onChangePhone,
  onResend,
}: CodeStepProps) {
  const repeat = (value: string) => Array.from({ length: 6 }, () => value).join('   ');
  
  return (
    <>
      <p className="text-muted-foreground text-center">
        Отправили код подтверждения на номер
      </p>
      <p className="font-semibold mb-2">{phone}</p>
      <Button
        type="button"
        variant="link"
        className="text-primary mb-4 p-0 h-auto"
        onClick={onChangePhone}
      >
        Изменить номер
      </Button>
      <IMaskInput
        mask={repeat('0')}
        placeholder={repeat('•')}
        value={code}
        unmask={true}
        onAccept={(value) => {
          onCodeChange(value);
          onCodeValidChange(true);
        }}
        className={`flex h-14 w-full rounded-lg border bg-background px-2 py-2 text-center text-xl tracking-[0.5em] ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mb-auto md:mb-4 ${
          isCodeValid 
            ? 'border-input' 
            : 'border-destructive text-destructive'
        }`}
        inputMode="numeric"
      />
      <Button
        type="button"
        variant="ghost"
        className={countdown > 0 || isLoading ? 'text-muted-foreground' : 'text-primary'}
        disabled={countdown > 0 || isLoading}
        onClick={onResend}
      >
        {countdown > 0 
          ? `Выслать повторно через ${countdown} сек`
          : 'Выслать код повторно'
        }
      </Button>
      
      <LoginHelpDialog />
    </>
  );
});

interface LoginFormProps {
  step: LoginStep;
  phone: string;
  isPhoneValid: boolean;
  captcha: string | null;
  secret: string;
  code: string;
  isCodeValid: boolean;
  isLoading: boolean;
  countdown: number;
  formRef: React.RefObject<HTMLFormElement | null>;
  onSubmit: (e: React.FormEvent) => void;
  setPhone: (value: string) => void;
  setIsPhoneValid: (valid: boolean) => void;
  setSecret: (value: string) => void;
  setCode: (value: string) => void;
  setIsCodeValid: (valid: boolean) => void;
  setStep: (step: LoginStep) => void;
  getSecret: () => void;
}

const LoginForm = memo(function LoginForm(props: LoginFormProps) {
  const {
    step,
    phone,
    isPhoneValid,
    captcha,
    secret,
    code,
    isCodeValid,
    isLoading,
    countdown,
    formRef,
    onSubmit,
    setPhone,
    setIsPhoneValid,
    setSecret,
    setCode,
    setIsCodeValid,
    setStep,
    getSecret,
  } = props;

  return (
    <form
      ref={formRef}
      className="flex flex-col items-center w-full flex-1"
      onSubmit={onSubmit}
    >
      {/* Логотип */}
      <div className="mb-auto md:mb-8 flex items-center justify-center">
        <img src={logoCharger} alt="Logo" className="h-12 w-auto" />
      </div>
      
      <h1 className="text-2xl font-bold mb-6 text-center">Личный кабинет</h1>
      
      {step === 'phone' && (
        <PhoneStep
          phone={phone}
          isPhoneValid={isPhoneValid}
          isLoading={isLoading}
          onPhoneChange={(value) => {
            setPhone(value);
            setIsPhoneValid(false);
          }}
          onPhoneComplete={() => setIsPhoneValid(true)}
        />
      )}
      
      {step === 'secret' && (
        <SecretStep
          captcha={captcha}
          secret={secret}
          isLoading={isLoading}
          onSecretChange={setSecret}
          onRefresh={getSecret}
          onBack={() => setStep('phone')}
        />
      )}
      
      {step === 'code' && (
        <CodeStep
          phone={phone}
          code={code}
          isCodeValid={isCodeValid}
          isLoading={isLoading}
          countdown={countdown}
          onCodeChange={setCode}
          onCodeValidChange={setIsCodeValid}
          onChangePhone={() => setStep('phone')}
          onResend={getSecret}
        />
      )}
    </form>
  );
});

export default function LoginPage() {
  const loginState = useLogin();

  return (
    <div className="flex min-h-screen items-center justify-center bg-foreground p-4 md:p-0">
      <Card className="w-full max-w-md md:w-[470px] min-h-screen md:min-h-0 rounded-none md:rounded-xl border-0 md:border">
        <CardContent className="flex flex-col items-center px-4 py-6 md:p-8 min-h-screen md:min-h-0">
          <LoginForm
            step={loginState.step}
            phone={loginState.phone}
            isPhoneValid={loginState.isPhoneValid}
            captcha={loginState.captcha}
            secret={loginState.secret}
            code={loginState.code}
            isCodeValid={loginState.isCodeValid}
            isLoading={loginState.isLoading}
            countdown={loginState.countdown}
            formRef={loginState.formRef}
            onSubmit={loginState.onSubmit}
            setPhone={loginState.setPhone}
            setIsPhoneValid={loginState.setIsPhoneValid}
            setSecret={loginState.setSecret}
            setCode={loginState.setCode}
            setIsCodeValid={loginState.setIsCodeValid}
            setStep={loginState.setStep}
            getSecret={loginState.getSecret}
          />
        </CardContent>
      </Card>
    </div>
  );
}

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import { useLogin, type LoginStep } from '@/hooks/useLogin';
import logoCharger from '@/assets/logo-charger.svg';

interface EmailStepProps {
  email: string;
  isLoading: boolean;
  onEmailChange: (value: string) => void;
}

const EmailStep = memo(function EmailStep({
  email,
  isLoading,
  onEmailChange,
}: EmailStepProps) {
  return (
    <>
      <h1 className="text-2xl font-bold mb-2 text-center text-foreground">
        Личный кабинет
      </h1>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Введите email, и мы пришлем ссылку для входа.
      </p>

      <Input
        type="email"
        required
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        className="h-12 text-base mb-4"
        autoFocus
      />

      <Button
        type="submit"
        className="w-full h-12 text-base"
        disabled={isLoading}
      >
        {isLoading ? 'Отправка...' : 'Получить ссылку'}
      </Button>
    </>
  );
});

interface WaitingStepProps {
  email: string;
  countdown: number;
  isLoading: boolean;
  onResend: () => void;
  onChangeEmail: () => void;
}

const WaitingStep = memo(function WaitingStep({
  email,
  countdown,
  isLoading,
  onResend,
  onChangeEmail,
}: WaitingStepProps) {
  return (
    <div className="flex flex-col items-center w-full">
      <h1 className="text-2xl font-bold mb-2 text-center text-foreground">
        Проверьте почту
      </h1>
      <p className="text-sm text-muted-foreground text-center mb-1">
        Мы отправили ссылку для входа на адрес
      </p>
      <p className="text-sm font-semibold text-foreground mb-6">{email}</p>

      <p className="text-xs text-muted-foreground text-center mb-6">
        Не нашли письмо? Проверьте папку «Спам» или отправьте повторно.
      </p>

      <Button
        type="button"
        variant={countdown > 0 ? 'outline' : 'default'}
        className="w-full h-12 mb-3"
        disabled={countdown > 0 || isLoading}
        onClick={onResend}
      >
        {countdown > 0
          ? `Отправить повторно через ${countdown} сек`
          : 'Отправить письмо еще раз'}
      </Button>

      <Button
        type="button"
        variant="link"
        className="text-primary p-0 h-auto"
        onClick={onChangeEmail}
      >
        Изменить email
      </Button>
    </div>
  );
});

export default function LoginPage() {
  const { formRef, step, email, isLoading, countdown, setEmail, setStep, sendMagicLink, onSubmit } = useLogin();

  return (
    <div className="flex min-h-screen items-center justify-center bg-foreground p-4 md:p-0">
      <Card className="w-full max-w-md md:w-[470px] min-h-screen md:min-h-0 rounded-none md:rounded-xl border-0 md:border">
        <CardContent className="flex flex-col items-center px-4 py-6 md:p-8 min-h-screen md:min-h-0">
          <form
            ref={formRef}
            className="flex flex-col items-center w-full flex-1"
            onSubmit={onSubmit}
          >
            <div className="mb-auto md:mb-8 flex items-center justify-center">
              <img src={logoCharger} alt="Logo" className="h-12 w-auto" />
            </div>

            {step === 'email' && (
              <EmailStep
                email={email}
                isLoading={isLoading}
                onEmailChange={setEmail}
              />
            )}

            {step === 'waiting' && (
              <WaitingStep
                email={email}
                countdown={countdown}
                isLoading={isLoading}
                onResend={sendMagicLink}
                onChangeEmail={() => setStep('email')}
              />
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

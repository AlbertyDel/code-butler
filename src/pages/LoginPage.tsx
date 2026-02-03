import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMaskInput } from 'react-imask';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Zap, RefreshCw, AlertCircle, Phone } from 'lucide-react';
import logoCharger from '@/assets/logo-charger.svg';

// Mock API functions (заглушки)
const mockApi = {
  getSecret: async (_data: { phone: string }): Promise<string | null> => {
    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 800));
    // Возвращаем null - пропускаем капчу, сразу идём к коду
    return null;
  },
  
  confirmSecret: async (_data: { phone: string; secret: string }): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    // Успешная валидация капчи
  },
  
  confirmCode: async (data: { phone: string; code: string }): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    // Проверка кода - для демо любой 6-значный код валиден
    if (data.code !== '123456' && data.code.length === 6) {
      // Для демо: код 123456 всегда успешен, остальные - 50% шанс ошибки
      if (Math.random() > 0.5) {
        throw new Error('Неверный код');
      }
    }
  }
};

type Step = 'phone' | 'secret' | 'code';

export default function LoginPage() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Фокус на инпут при смене шага
  useEffect(() => {
    const input = formRef.current?.querySelector('input');
    input?.focus();
  }, [step]);
  
  // Таймер обратного отсчёта
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown]);
  
  const startCountdown = () => {
    setCountdown(30);
  };
  
  const getSecret = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await mockApi.getSecret({ phone });
      setCaptcha(result);
      setStep(result ? 'secret' : 'code');
      setSecret('');
      if (!result) {
        startCountdown();
      }
    } catch (error) {
      console.error('Ошибка получения кода:', error);
    } finally {
      setIsLoading(false);
    }
  }, [phone]);
  
  const confirmSecret = useCallback(async () => {
    setIsLoading(true);
    try {
      await mockApi.confirmSecret({ phone, secret });
      setStep('code');
      setCode('');
      startCountdown();
    } catch (error) {
      console.error('Ошибка подтверждения капчи:', error);
      await getSecret();
    } finally {
      setIsLoading(false);
    }
  }, [phone, secret, getSecret]);
  
  // Автоматическая проверка кода при вводе 6 цифр
  useEffect(() => {
    if (code.length !== 6 || isLoading) return;
    
    const confirmCode = async () => {
      setIsLoading(true);
      setIsCodeValid(true);
      
      try {
        await mockApi.confirmCode({ phone, code });
        navigate('/dashboard');
      } catch (error) {
        setIsCodeValid(false);
        console.error('Неверный код:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    confirmCode();
  }, [code, phone, navigate, isLoading]);
  
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 'phone') {
      return getSecret();
    }
    
    if (step === 'secret') {
      return confirmSecret();
    }
  };
  
  const repeat = (value: string) => Array.from({ length: 6 }, () => value).join('   ');
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-foreground p-4 md:p-0">
      <Card className="w-full max-w-md md:w-[470px] min-h-screen md:min-h-0 rounded-none md:rounded-xl border-0 md:border">
        <CardContent className="flex flex-col items-center px-4 py-6 md:p-8 min-h-screen md:min-h-0">
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
            
            {/* Шаг 1: Ввод телефона */}
            {step === 'phone' && (
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
                    setPhone(value);
                    setIsPhoneValid(false);
                  }}
                  onComplete={() => setIsPhoneValid(true)}
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
            )}
            
            {/* Шаг 2: Капча */}
            {step === 'secret' && captcha && (
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
                  onClick={getSecret}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Обновить символы
                </Button>
                <Input
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
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
                    onClick={() => setStep('phone')}
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
            )}
            
            {/* Шаг 3: Ввод кода */}
            {step === 'code' && (
              <>
                <p className="text-muted-foreground text-center">
                  Отправили код подтверждения на номер
                </p>
                <p className="font-semibold mb-2">{phone}</p>
                <Button
                  type="button"
                  variant="link"
                  className="text-primary mb-4 p-0 h-auto"
                  onClick={() => setStep('phone')}
                >
                  Изменить номер
                </Button>
                <IMaskInput
                  mask={repeat('0')}
                  placeholder={repeat('•')}
                  value={code}
                  unmask={true}
                  onAccept={(value) => {
                    setCode(value);
                    setIsCodeValid(true);
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
                  onClick={getSecret}
                >
                  {countdown > 0 
                    ? `Выслать повторно через ${countdown} сек`
                    : 'Выслать код повторно'
                  }
                </Button>
                
                <LoginHelpDialog />
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Модальное окно "Не приходит СМС"
function LoginHelpDialog() {
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
          <AlertCircle className="h-7 w-7 text-amber-500" />
          <div className="text-sm">
            Вы не сообщили в службу поддержки новый номер телефона и код пришёл на старый.
            <br />
            Обратитесь по номеру{' '}
            <a href="tel:+74991107321" className="text-primary whitespace-nowrap font-medium hover:underline">
              <Phone className="h-3 w-3 inline mr-1" />
              +7 (499) 110-73-21
            </a>
          </div>
          <AlertCircle className="h-7 w-7 text-amber-500" />
          <div className="text-sm">
            Проблемы у вашего сотового оператора. Обратитесь в его службу поддержки.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock API functions (заглушки)
const mockApi = {
  getSecret: async (_data: { phone: string }): Promise<string | null> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return null;
  },

  confirmSecret: async (_data: { phone: string; secret: string }): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 800));
  },

  confirmCode: async (data: { phone: string; code: string }): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    if (data.code !== '123456' && data.code.length === 6) {
      if (Math.random() > 0.5) {
        throw new Error('Неверный код');
      }
    }
  }
};

export type LoginStep = 'phone' | 'secret' | 'code';

interface UseLoginReturn {
  formRef: React.RefObject<HTMLFormElement | null>;
  step: LoginStep;
  phone: string;
  isPhoneValid: boolean;
  captcha: string | null;
  secret: string;
  code: string;
  isCodeValid: boolean;
  isLoading: boolean;
  countdown: number;
  setPhone: (phone: string) => void;
  setIsPhoneValid: (valid: boolean) => void;
  setSecret: (secret: string) => void;
  setCode: (code: string) => void;
  setIsCodeValid: (valid: boolean) => void;
  setStep: (step: LoginStep) => void;
  getSecret: () => Promise<void>;
  confirmSecret: () => Promise<void>;
  onSubmit: (e: React.FormEvent) => void;
}

export function useLogin(): UseLoginReturn {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [step, setStep] = useState<LoginStep>('phone');
  const [phone, setPhone] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Focus input on step change
  useEffect(() => {
    const input = formRef.current?.querySelector('input');
    input?.focus();
  }, [step]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const startCountdown = useCallback(() => {
    setCountdown(30);
  }, []);

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
  }, [phone, startCountdown]);

  const confirmSecretHandler = useCallback(async () => {
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
  }, [phone, secret, getSecret, startCountdown]);

  // Auto-verify code when 6 digits entered
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

  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'phone') {
      getSecret();
      return;
    }

    if (step === 'secret') {
      confirmSecretHandler();
      return;
    }
  }, [step, getSecret, confirmSecretHandler]);

  return {
    formRef,
    step,
    phone,
    isPhoneValid,
    captcha,
    secret,
    code,
    isCodeValid,
    isLoading,
    countdown,
    setPhone,
    setIsPhoneValid,
    setSecret,
    setCode,
    setIsCodeValid,
    setStep,
    getSecret,
    confirmSecret: confirmSecretHandler,
    onSubmit,
  };
}

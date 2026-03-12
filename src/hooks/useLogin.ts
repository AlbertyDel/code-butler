import { useState, useRef, useEffect, useCallback } from 'react';

export type LoginStep = 'email' | 'waiting';

interface UseLoginReturn {
  formRef: React.RefObject<HTMLFormElement | null>;
  step: LoginStep;
  email: string;
  isLoading: boolean;
  countdown: number;
  setEmail: (email: string) => void;
  setStep: (step: LoginStep) => void;
  sendMagicLink: () => Promise<void>;
  onSubmit: (e: React.FormEvent) => void;
}

export function useLogin(): UseLoginReturn {
  const formRef = useRef<HTMLFormElement | null>(null);

  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
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
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendMagicLink = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: заменить на реальный API-запрос
      // Временная заглушка: email "test@test.com" переключает на экран ожидания
      await new Promise(resolve => setTimeout(resolve, 500));
      setStep('waiting');
      setCountdown(60);
    } catch (error) {
      console.error('Ошибка отправки ссылки:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'email') {
      sendMagicLink();
    }
  }, [step, sendMagicLink]);

  return {
    formRef,
    step,
    email,
    isLoading,
    countdown,
    setEmail,
    setStep,
    sendMagicLink,
    onSubmit,
  };
}

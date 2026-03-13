// src/hooks/useLogin.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type LoginStep = 'email' | 'waiting' | 'expired';

const RESEND_COOLDOWN = 60;

interface UseLoginReturn {
  formRef: React.RefObject<HTMLFormElement | null>;
  step: LoginStep;
  email: string;
  email: string;
  isLoading: boolean;
  countdown: number;
  setEmail: (email: string) => void;
  setEmail: (email: string) => void;
  setStep: (step: LoginStep) => void;
  sendMagicLink: () => Promise<void>;
  sendMagicLink: () => Promise<void>;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * Hook для email-based авторизации через magic link
 */
export function useLogin(): UseLoginReturn {
  const navigate = useNavigate();
  const { setAuthUser } = useAuth();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Валидация email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const sendMagicLink = useCallback(async () => {
    if (!isValidEmail(email)) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректный email',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/login', { email });
      setStep('waiting');
      setCountdown(RESEND_COOLDOWN);
      toast({
        title: 'Письмо отправлено',
        description: `Ссылка для входа отправлена на адрес ${email}`,
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось отправить ссылку',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, toast]);

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMagicLink();
  }, [sendMagicLink]);

  return {
    formRef,
    step,
    email,
    email,
    isLoading,
    countdown,
    setEmail,
    setEmail,
    setStep,
    sendMagicLink,
    sendMagicLink,
    onSubmit,
  };
}

/**
 * Хук для верификации magic link токена
 */
export function useVerifyToken() {
  const navigate = useNavigate();
  const { setAuthUser } = useAuth();
  const { toast } = useToast();

  const verifyToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      const response = await api.get(`/auth/verify/${token}`);
      
      if (response.data?.success) {
        // Получаем данные пользователя
        const meResponse = await api.get('/auth/me');
        const user = meResponse.data?.data?.user || meResponse.data?.user;
        
        if (user) {
          setAuthUser(user);
          toast({
            title: 'Успешно',
            description: 'Вы вошли в систему',
          });
          navigate('/dashboard');
          return true;
        }
      }
      return false;
    } catch (error) {
      toast({
        title: 'Ошибка верификации',
        description: error instanceof Error ? error.message : 'Ссылка недействительна или истекла',
        variant: 'destructive',
      });
      navigate('/login');
      return false;
    }
  }, [navigate, setAuthUser, toast]);

  return { verifyToken };
}

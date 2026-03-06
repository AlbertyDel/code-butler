import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// Convert phone to E.164 format
function formatPhoneToE164(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  // If starts with 8, replace with 7
  const normalized = digits.startsWith('8') ? '7' + digits.slice(1) : digits;
  // Add + if not present
  return normalized.startsWith('+') ? normalized : '+' + normalized;
}

// Auth API functions
const authApi = {
  getSecret: async (data: { phone: string }) => {
    const e164Phone = formatPhoneToE164(data.phone);
    const response = await api.post('/auth/init', { phone: e164Phone });
    return response.data;
  },

  confirmSecret: async (data: { phone: string; secret: string }) => {
    const e164Phone = formatPhoneToE164(data.phone);
    const response = await api.post('/auth/secret', { phone: e164Phone, secret: data.secret });
    return response.data;
  },

  confirmCode: async (data: { phone: string; code: string }) => {
    const e164Phone = formatPhoneToE164(data.phone);
    const response = await api.post('/auth/code', { phone: e164Phone, code: data.code });
    return response.data;
  },

  logout: async () => {
    const response = await api.delete('/auth');
    return response.data;
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
  const { setAuthUser } = useAuth();
  const formRef = useRef<HTMLFormElement | null>(null);
  const codeSubmitted = useRef(false);

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
      const response = await authApi.getSecret({ phone });
      // API returns { success: true, data: { captcha, timeout } }
      const result = response.data?.data || response.data;
      setCaptcha(result.captcha);
      setStep(result.captcha ? 'secret' : 'code');
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
      await authApi.confirmSecret({ phone, secret });
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
  const prevCodeRef = useRef('');

  useEffect(() => {
    console.log('[useLogin] useEffect:', { step, code, codeLength: code.length, isLoading, prevCode: prevCodeRef.current, submitted: codeSubmitted.current });
    
    // Only run on code step, when 6 digits entered
    if (step !== 'code' || code.length !== 6) return;
    
    // Prevent duplicate calls - only run when code actually changed
    if (code === prevCodeRef.current || codeSubmitted.current) return;
    
    prevCodeRef.current = code;
    codeSubmitted.current = true;
    
    console.log('[useLogin] Sending API request for code:', code);
    
    const confirmCode = async () => {
      setIsLoading(true);
      setIsCodeValid(true);

      try {
        await authApi.confirmCode({ phone, code });
        
        const meResponse = await api.get('/auth/me');
        console.log('[useLogin] /auth/me response:', meResponse.data);
        // API returns { success: true, data: { user } }
        const user = meResponse.data?.data?.user || meResponse.data?.user;
        if (user) {
          console.log('[useLogin] Setting auth user:', user);
          setAuthUser(user);
        }
        
        console.log('[useLogin] Navigating to dashboard');
        navigate('/dashboard');
      } catch (error) {
        setIsCodeValid(false);
        codeSubmitted.current = false;
        console.error('Неверный код:', error);
      } finally {
        setIsLoading(false);
      }
    };

    confirmCode();
  }, [code, phone, navigate, isLoading, step]);

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

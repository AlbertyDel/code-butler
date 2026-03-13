// src/pages/VerifyPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useVerifyToken } from '@/hooks/useLogin';

export default function VerifyPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { verifyToken } = useVerifyToken();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Токен не найден');
      setIsVerifying(false);
      return;
    }

    const verify = async () => {
      const success = await verifyToken(token);
      if (!success) {
        setError('Ссылка недействительна или истекла');
      }
      setIsVerifying(false);
    };

    verify();
  }, [token, verifyToken]);

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-foreground p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Выполняется вход...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-foreground p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="text-primary hover:underline"
            >
              Вернуться на страницу входа
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

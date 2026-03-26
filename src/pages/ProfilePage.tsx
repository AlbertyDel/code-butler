import { useState, useEffect } from 'react';
import { PageSkeleton } from '@/components/PageSkeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessState } from '@/contexts/BusinessStateContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Phone, Mail, Pencil, Clock, BadgeCheck, AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  let d = digits;
  if (d.startsWith('8') && d.length > 1) d = '7' + d.slice(1);
  if (!d.startsWith('7') && d.length > 0) d = '7' + d;

  if (d.length === 0) return '';
  if (d.length <= 1) return '+7';
  if (d.length <= 4) return `+7 (${d.slice(1)}`;
  if (d.length <= 7) return `+7 (${d.slice(1, 4)}) ${d.slice(4)}`;
  if (d.length <= 9) return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
}

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 11;
}

export default function ProfilePage() {
  const { user, setAuthUser, logout } = useAuth();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const { businessState } = useBusinessState();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const email = user?.email || '';

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setFirstName(user?.name?.split(' ')[0] || '');
    setLastName(user?.name?.split(' ').slice(1).join(' ') || '');
    setPhoneNumber(user?.phone || '');
  }, [user?.name, user?.phone]);

  const handlePhoneChange = (raw: string) => {
    const formatted = formatPhone(raw);
    setPhoneNumber(formatted);
    setPhoneError('');
  };

  const handleSave = () => {
    if (phoneNumber && !isValidPhone(phoneNumber)) {
      setPhoneError('Введите корректный номер телефона');
      return;
    }
    const newName = [firstName, lastName].filter(Boolean).join(' ');
    if (user) setAuthUser({ ...user, name: newName, phone: phoneNumber || undefined });
    setIsEditing(false);
    setPhoneError('');
    toast({ title: 'Профиль обновлен', description: 'Ваши данные успешно сохранены' });
  };

  const handleCancel = () => {
    setFirstName(user?.name?.split(' ')[0] || '');
    setLastName(user?.name?.split(' ').slice(1).join(' ') || '');
    setPhoneNumber(user?.phone || '');
    setPhoneError('');
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isPageLoading) return <PageSkeleton cards={3} />;

  return (
    <div className="space-y-6 sm:space-y-8">
      <Card>
        <CardContent className="pt-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Личные данные</h2>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 gap-1.5 text-muted-foreground hover:text-foreground px-2.5">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          {isEditing ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Введите имя" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Введите фамилию" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Input
                      id="phone"
                      value={phoneNumber}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="+7 (___) ___-__-__"
                      inputMode="tel"
                      maxLength={18}
                      className={cn(phoneError && 'border-destructive')}
                    />
                    {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Электронная почта</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={email} disabled className="bg-muted" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 w-full mt-6">
                <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto h-11 sm:h-10 text-sm font-medium">Отмена</Button>
                <Button onClick={handleSave} className="w-full sm:w-auto h-11 sm:h-10 text-sm font-medium">Сохранить</Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Имя</p>
                  <p className="font-medium">{firstName || <span className="text-muted-foreground italic">Не указано</span>}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Фамилия</p>
                  <p className="font-medium">{lastName || <span className="text-muted-foreground italic">Не указано</span>}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Телефон</p>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {phoneNumber || <span className="text-muted-foreground italic">Не указано</span>}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Электронная почта</p>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {email || <span className="text-muted-foreground italic">Не указано</span>}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {businessState !== 'promo' && (
        <Card>
          <CardHeader className="pb-4">
            <div className="text-base font-semibold">Коммерческие данные</div>
          </CardHeader>
          <CardContent>
            {businessState === 'pending' && (
              <div className="space-y-2">
                <p className="font-medium text-foreground">ООО &quot;Заряд Плюс&quot;</p>
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>Заявка в работе. Ожидаем ответ от банка.</span>
                </div>
              </div>
            )}
            {businessState === 'active' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">ООО &quot;Заряд Плюс&quot;</p>
                    <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    ИНН: 7705123456 &middot; КПП: 770501001 &middot; ОГРН: 1207700123456
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive text-sm font-medium">
              Выйти
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Выйти из аккаунта?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="w-full sm:w-auto h-11 sm:h-10">Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                className="w-full sm:w-auto h-11 sm:h-10 font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Выйти
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

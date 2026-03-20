import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessState } from '@/contexts/BusinessStateContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, Mail, Pencil, Check, X, Clock, BadgeCheck } from 'lucide-react';

export default function ProfilePage() {
  const { user, setAuthUser, logout } = useAuth();
  const { businessState } = useBusinessState();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const email = user?.email || '';

  useEffect(() => {
    setFirstName(user?.name?.split(' ')[0] || '');
    setLastName(user?.name?.split(' ').slice(1).join(' ') || '');
    setPhoneNumber(user?.phone || '');
  }, [user?.name, user?.phone]);

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'Пользователь';

  const handleSave = () => {
    const newName = [firstName, lastName].filter(Boolean).join(' ');
    if (user) setAuthUser({ ...user, name: newName, phone: phoneNumber || undefined });
    setIsEditing(false);
    toast({ title: 'Профиль обновлен', description: 'Ваши данные успешно сохранены' });
  };

  const handleCancel = () => {
    setFirstName(user?.name?.split(' ')[0] || '');
    setLastName(user?.name?.split(' ').slice(1).join(' ') || '');
    setPhoneNumber(user?.phone || '');
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6">

      {/* Personal data */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{displayName}</CardTitle>
                <p className="text-sm text-muted-foreground">Управление личной информацией</p>
              </div>
            </div>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Редактировать
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
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
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Введите номер телефона" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Электронная почта</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={email} disabled className="bg-muted" />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave}><Check className="mr-2 h-4 w-4" />Сохранить</Button>
                <Button variant="outline" onClick={handleCancel}><X className="mr-2 h-4 w-4" />Отмена</Button>
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

      {/* Payment requisites — hidden for promo state */}
      {businessState !== 'promo' && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Коммерческие данные</CardTitle>
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
                <Button variant="outline" className="w-full">Изменить реквизиты</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Logout — small, right-aligned at the bottom */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleLogout}>
          Выйти
        </Button>
      </div>
    </div>
  );
}

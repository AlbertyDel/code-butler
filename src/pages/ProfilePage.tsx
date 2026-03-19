import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, Mail, Pencil, Check, X, Building2, Clock } from 'lucide-react';

export default function ProfilePage() {
  const { user, setAuthUser } = useAuth();
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
    if (user) {
      setAuthUser({ ...user, name: newName, phone: phoneNumber || undefined });
    }
    setIsEditing(false);
    toast({
      title: "Профиль обновлен",
      description: "Ваши данные успешно сохранены",
    });
  };
  
  const handleCancel = () => {
    setFirstName(user?.name?.split(' ')[0] || '');
    setLastName(user?.name?.split(' ').slice(1).join(' ') || '');
    setPhoneNumber(user?.phone || '');
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Personal info card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{displayName}</CardTitle>
                <CardDescription>Личная информация</CardDescription>
              </div>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Редактировать
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={handleSave}>
                  <Check className="mr-2 h-4 w-4" />
                  Сохранить
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Отмена
                </Button>
              </div>
            </>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Имя</p>
                <p className="font-medium">{firstName || <span className="text-muted-foreground italic">Не указано</span>}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Фамилия</p>
                <p className="font-medium">{lastName || <span className="text-muted-foreground italic">Не указано</span>}</p>
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

      {/* Payment details card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Платежные реквизиты</CardTitle>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
              <Clock className="mr-1 h-3 w-3" />
              Проверка
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Организация</p>
              <p className="font-medium">ООО Заряд Плюс</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ИНН</p>
              <p className="font-medium">1234567890</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

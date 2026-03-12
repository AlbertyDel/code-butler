import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, Mail, Pencil, Check, X } from 'lucide-react';

export default function ProfilePage() {
  const { user, setAuthUser } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const email = user?.email || '';

  // Sync local state with user context
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
      title: "Профиль обновлён",
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {displayName}
                </CardTitle>
                <CardDescription>
                  Управление личной информацией
                </CardDescription>
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
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Введите имя"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Введите фамилию"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Введите номер телефона"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Электронная почта</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave}>
                  <Check className="mr-2 h-4 w-4" />
                  Сохранить
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Отмена
                </Button>
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
                  {phone || <span className="text-muted-foreground italic">Не указано</span>}
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
    </div>
  );
}

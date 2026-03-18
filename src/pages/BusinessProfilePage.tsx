import { useRef, useState } from 'react';
import {
  FileText,
  Settings2,
  TrendingUp,
  Users,
  ShoppingBag,
  Cpu,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const steps = [
  {
    icon: FileText,
    title: 'Оставьте заявку',
    description: 'Заполните реквизиты для автоматического перечисления средств.',
  },
  {
    icon: Settings2,
    title: 'Настройте тарифы',
    description: 'Укажите стоимость 1 кВт·ч и удобное время работы станции.',
  },
  {
    icon: TrendingUp,
    title: 'Получайте прибыль',
    description: 'Станция появится на картах, водители будут заряжаться, а вы — зарабатывать.',
  },
];

const benefits = [
  {
    icon: Users,
    title: 'Приток клиентов',
    description: 'Владельцы электромобилей приедут к вам специально ради зарядки.',
  },
  {
    icon: ShoppingBag,
    title: 'Рост выручки',
    description: 'Пока авто заряжается 30-60 минут, клиенты тратят деньги в вашем бизнесе.',
  },
  {
    icon: Cpu,
    title: 'Полная автоматизация',
    description: 'Биллинг, формирование чеков и выплаты мы берем на себя.',
  },
  {
    icon: BarChart3,
    title: 'Прозрачная аналитика',
    description: 'Отслеживайте доход и статистику сессий в реальном времени.',
  },
];

export default function BusinessProfilePage() {
  const formRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Имитация отправки
    setTimeout(() => setIsSubmitting(false), 2000);
  };

  return (
    <div className="space-y-12 pb-24 md:pb-8">
      {/* БЛОК 1: Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent to-background p-8 md:p-12 text-center space-y-5">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
          Активируйте Бизнес-профиль и&nbsp;получайте пассивный доход
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
          Откройте публичный доступ к вашей зарядной станции. Устанавливайте свои тарифы, привлекайте новых клиентов и автоматически получайте выплаты на банковский счет.
        </p>
        <Button size="lg" className="rounded-xl text-base px-8" onClick={scrollToForm}>
          Активировать профиль
        </Button>
      </section>

      {/* БЛОК 2: Как это работает */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground text-center">Как это работает</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step, i) => (
            <Card key={i} className="text-center border-none shadow-sm bg-card">
              <CardContent className="pt-6 space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* БЛОК 3: Преимущества */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground text-center">Преимущества</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {benefits.map((b, i) => (
            <Card key={i} className="border-none shadow-sm bg-card">
              <CardContent className="pt-6 flex gap-4 items-start">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{b.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{b.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* БЛОК 4: Форма */}
      <section ref={formRef}>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Реквизиты для выплат</CardTitle>
            <CardDescription>
              Заполните данные, чтобы мы могли переводить заработанные средства на ваш счет.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="ooo">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="ooo">Юр. лицо (ООО)</TabsTrigger>
                  <TabsTrigger value="ip">ИП</TabsTrigger>
                  <TabsTrigger value="selfemployed">Самозанятый</TabsTrigger>
                </TabsList>

                {/* ООО */}
                <TabsContent value="ooo" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>ИНН</Label>
                    <Input placeholder="10 цифр" maxLength={10} inputMode="numeric" />
                    <p className="text-xs text-muted-foreground">Название, КПП и ОГРН заполнятся автоматически</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Название компании</Label>
                    <Input disabled placeholder="Заполнится автоматически" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>КПП</Label>
                      <Input disabled placeholder="Автоматически" />
                    </div>
                    <div className="space-y-2">
                      <Label>ОГРН</Label>
                      <Input disabled placeholder="Автоматически" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Расчётный счёт</Label>
                    <Input placeholder="20 цифр" maxLength={20} inputMode="numeric" />
                  </div>
                  <div className="space-y-2">
                    <Label>БИК банка</Label>
                    <Input placeholder="9 цифр" maxLength={9} inputMode="numeric" />
                  </div>
                </TabsContent>

                {/* ИП */}
                <TabsContent value="ip" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>ИНН</Label>
                    <Input placeholder="12 цифр" maxLength={12} inputMode="numeric" />
                  </div>
                  <div className="space-y-2">
                    <Label>ФИО</Label>
                    <Input placeholder="Иванов Иван Иванович" />
                  </div>
                  <div className="space-y-2">
                    <Label>Расчётный счёт</Label>
                    <Input placeholder="20 цифр" maxLength={20} inputMode="numeric" />
                  </div>
                  <div className="space-y-2">
                    <Label>БИК банка</Label>
                    <Input placeholder="9 цифр" maxLength={9} inputMode="numeric" />
                  </div>
                </TabsContent>

                {/* Самозанятый */}
                <TabsContent value="selfemployed" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>ИНН</Label>
                    <Input placeholder="12 цифр" maxLength={12} inputMode="numeric" />
                  </div>
                  <div className="space-y-2">
                    <Label>ФИО</Label>
                    <Input placeholder="Иванов Иван Иванович" />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Паспортные данные</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Серия и номер</Label>
                        <Input placeholder="0000 000000" />
                      </div>
                      <div className="space-y-2">
                        <Label>Дата выдачи</Label>
                        <Input placeholder="ДД.ММ.ГГГГ" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Кем выдан</Label>
                      <Input placeholder="Отделение УФМС..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Код подразделения</Label>
                      <Input placeholder="000-000" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Адрес регистрации</Label>
                    <Input placeholder="г. Москва, ул. ..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Расчётный счёт</Label>
                    <Input placeholder="20 цифр" maxLength={20} inputMode="numeric" />
                  </div>
                  <div className="space-y-2">
                    <Label>БИК банка</Label>
                    <Input placeholder="9 цифр" maxLength={9} inputMode="numeric" />
                  </div>
                </TabsContent>
              </Tabs>

              <Button type="submit" className="w-full rounded-xl" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  'Отправить заявку'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

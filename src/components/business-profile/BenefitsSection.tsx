import { Users, ShoppingBag, Cpu, BarChart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const benefits = [
  {
    icon: Users,
    title: 'Приток клиентов',
    description: 'Владельцы электромобилей приедут к вам специально ради зарядки.',
  },
  {
    icon: ShoppingBag,
    title: 'Рост выручки',
    description: 'Пока электромобиль заряжается, владельцы проводят время в вашем заведении, пользуясь основными услугами.',
  },
  {
    icon: Cpu,
    title: 'Полная автоматизация',
    description: 'Биллинг, формирование чеков и выплаты мы берем на себя.',
  },
  {
    icon: BarChart,
    title: 'Прозрачная аналитика',
    description: 'Отслеживайте доход и статистику сессий в реальном времени.',
  },
];

export function BenefitsSection() {
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground text-center">Преимущества</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {benefits.map((b, i) => (
          <Card key={i} className="rounded-2xl shadow-sm bg-card">
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
  );
}

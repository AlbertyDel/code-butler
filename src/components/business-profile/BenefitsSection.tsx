import { Users, ShoppingBag, Cpu } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const benefits = [
  {
    icon: Users,
    title: 'Точка притяжения',
    description: 'Владельцы электромобилей планируют маршруты через станции зарядки. Ваша локация станет для них приоритетной остановкой.',
  },
  {
    icon: ShoppingBag,
    title: 'Дополнительная выручка',
    description: 'Процесс зарядки занимает время, которое клиенты с удовольствием проведут у вас, увеличивая средний чек.',
  },
  {
    icon: Cpu,
    title: 'Автоматизация финансов',
    description: 'Прием оплат, отправка чеков и выводы на ваш счет происходят автоматически.',
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

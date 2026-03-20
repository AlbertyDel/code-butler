import { FileText, Sliders, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const steps = [
  {
    icon: FileText,
    title: 'Оставьте заявку',
    description: 'Заполните данные для вашей идентификации.',
  },
  {
    icon: Sliders,
    title: 'Настройте тарифы',
    description: 'Укажите стоимость 1 кВт·ч и время работы станции.',
  },
  {
    icon: TrendingUp,
    title: 'Получайте прибыль',
    description: 'Станция появится на картах нашего приложения. Вы будете получать стабильный доход от каждой сессии зарядки.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground text-center">Как это работает</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, i) => (
          <Card key={i} className="rounded-2xl text-center shadow-sm bg-card">
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
  );
}

import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onActivate: () => void;
}

export function HeroSection({ onActivate }: HeroSectionProps) {
  return (
    <section className="rounded-2xl bg-accent p-6 sm:p-10 text-center space-y-5">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">
        Активируйте Бизнес-профиль и&nbsp;получайте доход
      </h1>
      <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
        Откройте публичный доступ к вашей зарядной станции. Устанавливайте свои тарифы, привлекайте новых клиентов и получайте выплаты на счет.
      </p>
      <Button size="lg" className="rounded-xl text-base px-8" onClick={onActivate}>
        Активировать профиль
      </Button>
    </section>
  );
}

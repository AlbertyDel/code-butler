import { useRef } from 'react';
import { HeroSection } from '@/components/business-profile/HeroSection';
import { HowItWorksSection } from '@/components/business-profile/HowItWorksSection';
import { BenefitsSection } from '@/components/business-profile/BenefitsSection';
import { RegistrationForm } from '@/components/business-profile/RegistrationForm';

export default function BusinessProfilePage() {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-12 pb-24 md:pb-8">
      <HeroSection onActivate={scrollToForm} />
      <HowItWorksSection />
      <BenefitsSection />
      <section ref={formRef}>
        <RegistrationForm />
      </section>
    </div>
  );
}

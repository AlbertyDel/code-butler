import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Zap,
  List,
  Briefcase,
  ReceiptText,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusinessState } from '@/contexts/BusinessStateContext';
import logoCharger from '@/assets/logo-charger.svg';

export function DesktopSidebar() {
  const { businessState } = useBusinessState();
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Главная', show: true },
    { to: '/stations', icon: Zap, label: 'Станции', show: true },
    { to: '/sessions', icon: List, label: 'Сессии', show: true },
    { to: '/business-profile', icon: Briefcase, label: 'Бизнес-профиль', show: businessState === 'promo' },
    { to: '/tariffs', icon: ReceiptText, label: 'Тарифы', show: businessState === 'active' },
    { to: '/finance', icon: Wallet, label: 'Финансы', show: businessState === 'active' },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center justify-center border-b px-6">
        <img src={logoCharger} alt="Charger" className="h-8" />
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          })}
      </nav>
    </aside>
  );
}

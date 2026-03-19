import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Zap,
  List,
  Briefcase,
  Banknote,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusinessState } from '@/contexts/BusinessStateContext';

export function MobileNavigation() {
  const { businessState } = useBusinessState();
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Главная', show: true },
    { to: '/stations', icon: Zap, label: 'Станции', show: true },
    { to: '/sessions', icon: List, label: 'Сессии', show: true },
    { to: '/business-profile', icon: Briefcase, label: 'Бизнес', show: businessState === 'promo' },
    { to: '/tariffs', icon: Banknote, label: 'Тарифы', show: businessState === 'active' },
    { to: '/finance', icon: Wallet, label: 'Финансы', show: businessState === 'active' },
  ];

  const visibleItems = navItems.filter((item) => item.show);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[60] border-t bg-card/95 pointer-events-auto backdrop-blur supports-[backdrop-filter]:bg-card/80"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around">
        {visibleItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'mobile-nav-item flex-1 touch-manipulation',
                isActive && 'active'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon
                className={cn(
                  'h-6 w-6 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span
                className={cn(
                  'text-xs font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  Zap, 
  History, 
  BarChart3, 
  Settings,
  CreditCard,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const individualNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Главная' },
  { to: '/stations', icon: MapPin, label: 'Станции' },
  { to: '/charging', icon: Zap, label: 'Зарядка' },
  { to: '/history', icon: History, label: 'История' },
  { to: '/statistics', icon: BarChart3, label: 'Статистика' },
];

const businessNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Главная' },
  { to: '/stations', icon: MapPin, label: 'Станции' },
  { to: '/tariffs', icon: CreditCard, label: 'Тарифы' },
  { to: '/history', icon: History, label: 'История' },
  { to: '/statistics', icon: BarChart3, label: 'Отчёты' },
  { to: '/organization', icon: Building2, label: 'Организация' },
];

export function DesktopSidebar() {
  const { userRole } = useAuth();
  const location = useLocation();
  const navItems = userRole === 'business' ? businessNavItems : individualNavItems;

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold">EV Charge</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || 
            (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="border-t p-4">
        <NavLink
          to="/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
            location.pathname === '/settings'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Settings className="h-5 w-5" />
          Настройки
        </NavLink>
      </div>
    </aside>
  );
}

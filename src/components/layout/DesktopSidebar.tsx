import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  Zap,
  CreditCard,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import logoCharger from '@/assets/logo-charger.svg';


const individualNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Главная' },
  { to: '/stations', icon: MapPin, label: 'Станции' },
  { to: '/sessions', icon: Zap, label: 'Сессии' },
];

const businessNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Главная' },
  { to: '/stations', icon: MapPin, label: 'Станции' },
  { to: '/tariffs', icon: CreditCard, label: 'Тарифы' },
  { to: '/organization', icon: Building2, label: 'Организация' },
];

export function DesktopSidebar() {
  const { userRole } = useAuth();
  const location = useLocation();
  const navItems = userRole === 'business' ? businessNavItems : individualNavItems;

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <img src={logoCharger} alt="Charger" className="h-7" />
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

    </aside>
  );
}

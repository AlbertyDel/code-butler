import { CircleUserRound, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import logoCharger from '@/assets/logo-charger.svg';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Главная',
  '/stations': 'Станции',
  '/sessions': 'Сессии',
  '/business-profile': 'Бизнес-профиль',
  '/profile': 'Профиль',
  '/tariffs': 'Тарифы',
  '/finance': 'Финансы',
};

export function TopBar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentTitle = pageTitles[location.pathname] || '';

  if (isMobile) {
    return (
      <header className="fixed top-0 left-0 w-full z-50 flex h-16 items-center justify-between border-b bg-white px-4">
        <img src={logoCharger} alt="Charger" className="h-6" />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 text-muted-foreground cursor-pointer">
                <CircleUserRound className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover">
              <DropdownMenuLabel className="text-sm font-normal text-muted-foreground">
                test@example.com
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                Профиль
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-64 right-0 z-50 flex h-16 items-center justify-between border-b bg-white px-6">
      <h1 className="text-xl font-bold text-foreground">{currentTitle}</h1>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground cursor-pointer">
          <Bell className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 text-muted-foreground cursor-pointer">
              <CircleUserRound className="h-5 w-5" />
              <span className="text-sm font-medium">Профиль</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover">
            <DropdownMenuLabel className="text-sm font-normal text-muted-foreground">
              test@example.com
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
              Профиль
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

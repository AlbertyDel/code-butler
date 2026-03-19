import { CircleUserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessState } from '@/contexts/BusinessStateContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import logoCharger from '@/assets/logo-charger.svg';

export function TopBar() {
  const { logout } = useAuth();
  const { businessState } = useBusinessState();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      {/* Left: logo on mobile */}
      {isMobile ? (
        <img src={logoCharger} alt="Charger" className="h-6" />
      ) : (
        <div />
      )}

      {/* Center: status badge */}
      <div className="absolute left-1/2 -translate-x-1/2">
        {businessState === 'pending' && (
          <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-700 gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Проверка реквизитов
          </Badge>
        )}
        {businessState === 'active' && (
          <Badge variant="outline" className="border-primary bg-accent text-accent-foreground gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Бизнес-режим
          </Badge>
        )}
      </div>

      {/* Right: user menu */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 text-muted-foreground">
              <CircleUserRound className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-medium">Профиль</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover">
            <DropdownMenuLabel className="text-sm font-normal text-muted-foreground">
              test@example.com
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              Профиль
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

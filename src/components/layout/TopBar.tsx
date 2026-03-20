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
    <header className="fixed top-0 left-0 w-full md:left-64 md:w-[calc(100%-16rem)] z-50 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
      {isMobile ? (
        <img src={logoCharger} alt="Charger" className="h-6" />
      ) : (
        <div />
      )}

      <div className="flex items-center gap-3">
        {businessState === 'pending' && (
          <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-700 gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Проверка реквизитов
          </Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="lg" className="gap-2 text-muted-foreground cursor-pointer px-3">
              <CircleUserRound className="h-7 w-7" />
              <span className="hidden sm:inline text-sm font-medium">Профиль</span>
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

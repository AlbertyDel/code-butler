import { CircleUserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessState } from '@/contexts/BusinessStateContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import logoCharger from '@/assets/logo-charger.svg';
import { useState } from 'react';

interface TopBarProps {
  isLoading?: boolean;
}

export function TopBar({ isLoading = false }: TopBarProps) {
  const { logout } = useAuth();
  const { businessState } = useBusinessState();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full md:left-64 md:w-[calc(100%-16rem)] z-50 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6 pr-[var(--removed-body-scroll-bar-size)]">
        {isMobile ? (
          <img src={logoCharger} alt="Charger" className="h-6" />
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          {isLoading ? (
            <>
              <Skeleton className="h-6 w-28 rounded-full" />
              <div className="flex items-center gap-2 px-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="hidden sm:block h-4 w-20" />
              </div>
            </>
          ) : (
            <>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="lg" className="gap-2 text-muted-foreground cursor-pointer px-3">
                    <CircleUserRound className="!h-8 !w-8" />
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
                  <DropdownMenuItem
                    onClick={() => setLogoutDialogOpen(true)}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </header>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Выход из аккаунта</AlertDialogTitle>
            <AlertDialogDescription>
              Вам потребуется заново авторизоваться в системе.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Выйти
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

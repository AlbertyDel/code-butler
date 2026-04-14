import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileNavigation } from './MobileNavigation';
import { TopBar } from './TopBar';
import { PageSkeleton } from '@/components/PageSkeleton';

export function AppLayout() {
  const isMobile = useIsMobile();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (isMobile) {
    return (
      <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
        <TopBar isLoading={isInitialLoading} />
        <main className="flex-1 overflow-y-auto pt-20 pb-24 px-4 sm:pt-24">
          {isInitialLoading ? <PageSkeleton cards={4} /> : <Outlet />}
        </main>
        <MobileNavigation />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <TopBar isLoading={isInitialLoading} />
      <DesktopSidebar />
      <main className="flex-1 overflow-y-auto pt-24 px-6 pb-6 md:ml-64">
        {isInitialLoading ? <PageSkeleton cards={6} /> : <Outlet />}
      </main>
    </div>
  );
}

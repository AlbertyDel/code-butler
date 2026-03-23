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
      <div className="min-h-screen bg-background">
        <TopBar isLoading={isInitialLoading} />
        <main className="pt-16 px-4 pb-20 overflow-auto mt-8">
          {isInitialLoading ? <PageSkeleton cards={4} /> : <Outlet />}
        </main>
        <MobileNavigation />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <TopBar isLoading={isInitialLoading} />
      <DesktopSidebar />
      <main className="pt-16 md:ml-64 min-h-screen overflow-auto p-6 mt-4">
        {isInitialLoading ? <PageSkeleton cards={6} /> : <Outlet />}
      </main>
    </div>
  );
}

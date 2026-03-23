import React from 'react';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileNavigation } from './MobileNavigation';
import { TopBar } from './TopBar';

export function AppLayout() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <main className="pt-16 px-4 pb-20 overflow-auto mt-8">
          <Outlet />
        </main>
        <MobileNavigation />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <TopBar />
      <DesktopSidebar />
      <main className="pt-16 md:ml-64 min-h-screen overflow-auto p-6 mt-4">
        <Outlet />
      </main>
    </div>
  );
}

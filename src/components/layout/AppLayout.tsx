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
        <main className="pt-16 px-4 pb-20 overflow-auto">
          <Outlet />
        </main>
        <MobileNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DesktopSidebar />
      <TopBar />
      <main className="ml-64 pt-16 min-h-[calc(100vh-4rem)] overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}

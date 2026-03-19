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
      <div className="flex min-h-screen flex-col bg-background">
        <TopBar />
        <main className="flex-1 overflow-auto px-4 pt-4 pb-20">
          <Outlet />
        </main>
        <MobileNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <DesktopSidebar />
      <main className="pt-16 md:ml-64 min-h-screen overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}

import { memo, useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MockToggle } from '@/components/MockToggle';
import { useMockToggle } from '@/hooks/useMockToggle';
import { useSessions } from '@/hooks/useSessions';
import { mockSessions, mockStations } from '@/lib/mock-data';
import { Clock, Zap, History } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import type { ChargingSession, Station, Connector } from '@/types';

const ITEMS_PER_PAGE = 10;

interface CompletedSessionCardProps {
  session: ChargingSession;
  station: Station | undefined;
  connector: Connector | undefined;
  formatDuration: (startTime: string, endTime?: string) => string;
}

const CompletedSessionCard = memo(function CompletedSessionCard({
  session,
  station,
  connector,
  formatDuration,
}: CompletedSessionCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {station && (
              <p className="font-medium truncate">
                {station.name}
              </p>
            )}
            {station && (
              <p className="text-sm text-muted-foreground truncate">
                {station.address}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(session.startTime, session.endTime)}
              </span>
              {connector && (
                <Badge variant="secondary" className="text-xs">
                  {connector.type} · {connector.powerKw} кВт
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-semibold flex items-center gap-1">
              <Zap className="h-4 w-4 text-primary" />
              {session.energyKwh} кВт·ч
            </p>
            <p className="text-xs text-muted-foreground">Заряжено</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  return prevProps.session.id === nextProps.session.id &&
    prevProps.station?.id === nextProps.station?.id;
});

interface SessionGroupProps {
  label: string;
  sessions: ChargingSession[];
  getStation: (stationId: string) => Station | undefined;
  formatDuration: (startTime: string, endTime?: string) => string;
}

const SessionGroup = memo(function SessionGroup({
  label,
  sessions,
  getStation,
  formatDuration,
}: SessionGroupProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground px-1">
        {label}
      </h2>
      <div className="space-y-2">
        {sessions.map((session) => {
          const station = getStation(session.stationId);
          const connector = station?.connectors[0];
          return (
            <CompletedSessionCard
              key={session.id}
              session={session}
              station={station}
              connector={connector}
              formatDuration={formatDuration}
            />
          );
        })}
      </div>
    </div>
  );
});

function EmptyHistoryState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center text-center max-w-sm">
        <History className="h-16 w-16 text-muted-foreground/40" />
        <p className="mt-4 text-sm text-muted-foreground">
          У вас пока нет завершенных сессий. Здесь будет отображаться подробная история зарядок.
        </p>
      </div>
    </div>
  );
}

function buildGroupedSessions(completedSessions: ChargingSession[]) {
  const groups: { label: string; sessions: ChargingSession[] }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const sessionsByDate = new Map<string, ChargingSession[]>();

  completedSessions.forEach(session => {
    const date = new Date(session.startTime);
    date.setHours(0, 0, 0, 0);
    const key = date.toISOString();

    if (!sessionsByDate.has(key)) {
      sessionsByDate.set(key, []);
    }
    sessionsByDate.get(key)!.push(session);
  });

  const sortedDates = Array.from(sessionsByDate.keys()).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  sortedDates.forEach(dateKey => {
    const date = new Date(dateKey);
    let label: string;

    if (date.getTime() === today.getTime()) {
      label = 'Сегодня';
    } else if (date.getTime() === yesterday.getTime()) {
      label = 'Вчера';
    } else {
      label = date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    groups.push({
      label,
      sessions: sessionsByDate.get(dateKey)!.sort((a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      ),
    });
  });

  return groups;
}

const formatDurationFn = (startTime: string, endTime?: string): string => {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const durationMs = end.getTime() - start.getTime();
  const minutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours} ч ${mins} м` : `${mins} м`;
};

export default function SessionsPage() {
  const {
    completedSessions: realCompletedSessions,
    groupedSessions: realGroupedSessions,
    getStation: realGetStation,
    formatDuration: realFormatDuration,
  } = useSessions();

  const [showMock, setShowMock] = useMockToggle('sessions_mock');
  const [mockSessionsLocal, setMockSessionsLocal] = useState<ChargingSession[]>(() => [...mockSessions]);

  const mockCompletedSessions = useMemo(() =>
    mockSessionsLocal.filter(s => s.status !== 'active'), [mockSessionsLocal]);
  const mockGrouped = useMemo(() =>
    buildGroupedSessions(mockCompletedSessions), [mockCompletedSessions]);

  const mockGetStation = useCallback((stationId: string) =>
    mockStations.find(s => s.id === stationId), []);

  const completedSessions = showMock ? mockCompletedSessions : realCompletedSessions;
  const groupedSessions = showMock ? mockGrouped : realGroupedSessions;
  const getStation = showMock ? mockGetStation : realGetStation;
  const formatDuration = showMock ? formatDurationFn : realFormatDuration;

  const handleStopSession = useCallback((sessionId: string, station: Station | undefined) => {
    if (showMock) {
      setMockSessionsLocal(prev => prev.map(s =>
        s.id === sessionId ? {
          ...s,
          status: 'completed' as const,
          endTime: new Date().toISOString(),
        } : s
      ));
    } else if (station) {
      realStopSession({ sessionId, deviceId: station.id });
    }
  }, [showMock, realStopSession]);

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(completedSessions.length / ITEMS_PER_PAGE);

  const paginatedGroups = useMemo(() => {
    const allCompleted = groupedSessions.flatMap(g => 
      g.sessions.map(s => ({ ...s, _groupLabel: g.label }))
    );
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = allCompleted.slice(start, start + ITEMS_PER_PAGE);

    const groups: { label: string; sessions: ChargingSession[] }[] = [];
    pageItems.forEach(item => {
      const last = groups[groups.length - 1];
      if (last && last.label === item._groupLabel) {
        last.sessions.push(item);
      } else {
        groups.push({ label: item._groupLabel, sessions: [item] });
      }
    });
    return groups;
  }, [groupedSessions, currentPage]);

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  const mockToggle = <MockToggle checked={showMock} onCheckedChange={setShowMock} />;

  return (
    <div className="space-y-6 sm:space-y-8">
      {mockToggle}

      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">История зарядных сессий</h1>
        
        {paginatedGroups.length === 0 ? (
          <EmptyHistoryState />
        ) : (
          <>
            {paginatedGroups.map((group) => (
              <SessionGroup
                key={group.label}
                label={group.label}
                sessions={group.sessions}
                getStation={getStation}
                formatDuration={formatDuration}
              />
            ))}

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {getPageNumbers().map((page, i) =>
                    page === 'ellipsis' ? (
                      <PaginationItem key={`e-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={currentPage === page}
                          onClick={() => setCurrentPage(page)}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </div>
  );
}

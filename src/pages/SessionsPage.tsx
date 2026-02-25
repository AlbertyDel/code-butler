import { memo, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActiveSessionCard } from '@/components/sessions/ActiveSessionCard';
import { useSessions } from '@/hooks/useSessions';
import { Clock, Zap } from 'lucide-react';
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

export default function SessionsPage() {
  const {
    activeSessions,
    completedSessions,
    groupedSessions,
    stopSession,
    getStation,
    formatDuration,
  } = useSessions();

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(completedSessions.length / ITEMS_PER_PAGE);

  // Paginate: flatten completed sessions, slice, then re-group
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

  return (
    <div className="space-y-6">
      {activeSessions.length > 0 && (
        <div className="space-y-3">
          {activeSessions.map((session) => {
            const station = getStation(session.stationId);
            return (
              <ActiveSessionCard
                key={session.id}
                session={session}
                station={station}
                onStop={stopSession}
              />
            );
          })}
        </div>
      )}

      <div className="space-y-4">
        <h1 className="text-xl font-bold">История зарядных сессий</h1>
        
        {paginatedGroups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Нет завершённых сессий</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                История зарядок появится здесь
              </p>
            </CardContent>
          </Card>
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

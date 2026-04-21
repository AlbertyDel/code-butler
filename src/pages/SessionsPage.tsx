import { memo, useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MockToggle } from '@/components/MockToggle';
import { useMockToggle } from '@/hooks/useMockToggle';
import { useSessions } from '@/hooks/useSessions';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessState } from '@/contexts/BusinessStateContext';
import { mockSessions, mockStations } from '@/lib/mock-data';
import { Clock, Zap, History, BatteryCharging } from 'lucide-react';
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

// ── Business mock active sessions ──
const MOCK_BIZ_ACTIVE_SESSIONS: ChargingSession[] = [
  {
    id: 'biz-sess-a1',
    stationId: 'mock-station-1',
    connectorId: 'c1',
    userId: 'user-ext-1',
    startTime: new Date(Date.now() - 45 * 60000).toISOString(),
    energyKwh: 32.4,
    cost: 486,
    status: 'active',
    currentAmps: 32,
    currentKw: 22.1,
  },
  {
    id: 'biz-sess-a2',
    stationId: 'mock-station-2',
    connectorId: 'c2',
    userId: 'user-ext-2',
    startTime: new Date(Date.now() - 120 * 60000).toISOString(),
    energyKwh: 18.7,
    cost: 280.5,
    status: 'active',
    currentAmps: 16,
    currentKw: 7.4,
  },
  {
    id: 'biz-sess-a3',
    stationId: 'mock-station-1',
    connectorId: 'c1',
    userId: 'user-ext-3',
    startTime: new Date(Date.now() - 10 * 60000).toISOString(),
    energyKwh: 4.2,
    cost: 63,
    status: 'active',
    currentAmps: 28,
    currentKw: 19.5,
  },
];

type BizFilter = 'all' | 'active' | 'completed';

// ── Unified session card for both active and completed ──
interface UnifiedSessionCardProps {
  session: ChargingSession;
  station: Station | undefined;
  connector: Connector | undefined;
  formatDuration: (startTime: string, endTime?: string) => string;
}

const UnifiedSessionCard = memo(function UnifiedSessionCard({
  session,
  station,
  connector,
  formatDuration,
}: UnifiedSessionCardProps) {
  const isActive = session.status === 'active';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {station && (
              <p className="font-medium truncate">{station.name}</p>
            )}
            {station && (
              <p className="text-sm text-muted-foreground truncate">{station.address}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge
                variant="secondary"
                className={isActive
                  ? 'text-xs bg-primary/10 text-primary border-0'
                  : 'text-xs'}
              >
                {isActive && <BatteryCharging className="h-3 w-3 mr-1" />}
                {isActive ? 'Активна' : 'Завершена'}
              </Badge>
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
            <p className="text-lg font-semibold flex items-center gap-1 justify-end">
              <Zap className="h-4 w-4 text-primary" />
              {Number(session.energyKwh).toFixed(1)} кВт·ч
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  return prevProps.session.id === nextProps.session.id &&
    prevProps.session.status === nextProps.session.status &&
    prevProps.session.energyKwh === nextProps.session.energyKwh &&
    prevProps.session.currentKw === nextProps.session.currentKw &&
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
            <UnifiedSessionCard
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

function buildGroupedSessions(sessions: ChargingSession[]) {
  const groups: { label: string; sessions: ChargingSession[] }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const sessionsByDate = new Map<string, ChargingSession[]>();

  sessions.forEach(session => {
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
    sessions: realSessions,
    activeSessions: realActiveSessions,
    completedSessions: realCompletedSessions,
    groupedSessions: realGroupedSessions,
    getStation: realGetStation,
    formatDuration: realFormatDuration,
  } = useSessions();

  const { userRole } = useAuth();
  const { businessState } = useBusinessState();
  const isBusiness = userRole === 'business' || businessState === 'active';

  const [showMock, setShowMock] = useMockToggle('sessions_mock');
  const [mockSessionsLocal] = useState<ChargingSession[]>(() => [...mockSessions]);
  const [bizFilter, setBizFilter] = useState<BizFilter>('all');

  const mockCompletedSessions = useMemo(() =>
    mockSessionsLocal.filter(s => s.status !== 'active'), [mockSessionsLocal]);
  const mockGrouped = useMemo(() =>
    buildGroupedSessions(mockCompletedSessions), [mockCompletedSessions]);

  const mockGetStation = useCallback((stationId: string) =>
    mockStations.find(s => s.id === stationId), []);

  const completedSessions = showMock ? mockCompletedSessions : realCompletedSessions;
  const activeSessions = showMock ? (isBusiness ? MOCK_BIZ_ACTIVE_SESSIONS : realActiveSessions) : realActiveSessions;
  const groupedSessions = showMock ? mockGrouped : realGroupedSessions;
  const getStation = showMock ? mockGetStation : realGetStation;
  const formatDuration = showMock ? formatDurationFn : realFormatDuration;

  const [currentPage, setCurrentPage] = useState(1);

  // ── Business: build unified list for "all" tab ──
  const allSessionsSorted = useMemo(() => {
    if (!isBusiness || bizFilter !== 'all') return [];
    return [...activeSessions, ...completedSessions].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }, [isBusiness, bizFilter, activeSessions, completedSessions]);

  // Sessions source for pagination
  const sessionsForPagination = useMemo(() => {
    if (!isBusiness) return completedSessions;
    if (bizFilter === 'all') return allSessionsSorted;
    if (bizFilter === 'active') return activeSessions;
    return completedSessions;
  }, [isBusiness, bizFilter, allSessionsSorted, activeSessions, completedSessions]);

  const totalPages = Math.ceil(sessionsForPagination.length / ITEMS_PER_PAGE);

  // Build grouped pages for display
  const paginatedGroups = useMemo(() => {
    const source = sessionsForPagination;
    if (source.length === 0) return [];

    // For business "active" tab, no date grouping needed — flat list
    if (isBusiness && bizFilter === 'active') {
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const pageItems = source.slice(start, start + ITEMS_PER_PAGE);
      if (pageItems.length === 0) return [];
      return [{ label: '', sessions: pageItems }];
    }

    const grouped = buildGroupedSessions(source);
    const allFlat = grouped.flatMap(g =>
      g.sessions.map(s => ({ ...s, _groupLabel: g.label }))
    );
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = allFlat.slice(start, start + ITEMS_PER_PAGE);

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
  }, [sessionsForPagination, isBusiness, bizFilter, currentPage]);

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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {isBusiness ? 'Зарядные сессии' : 'История зарядок'}
        </h1>

        {/* Business filter tabs */}
        {isBusiness && (
          <div className="flex gap-1">
            {([
              { key: 'all' as BizFilter, label: 'Все' },
              { key: 'active' as BizFilter, label: 'Активные' },
              { key: 'completed' as BizFilter, label: 'Завершённые' },
            ]).map((tab) => (
              <Button
                key={tab.key}
                size="sm"
                variant={bizFilter === tab.key ? 'default' : 'outline'}
                onClick={() => { setBizFilter(tab.key); setCurrentPage(1); }}
                className="whitespace-nowrap"
              >
                {tab.label}
                {tab.key === 'active' && activeSessions.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-5 min-w-[20px] px-1.5 text-xs">
                    {activeSessions.length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        )}

        {/* Unified session list */}
        {paginatedGroups.length === 0 ? (
          bizFilter === 'active' ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center text-center max-w-sm">
                <BatteryCharging className="h-16 w-16 text-muted-foreground/40" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Нет активных сессий
                </p>
              </div>
            </div>
          ) : (
            <EmptyHistoryState />
          )
        ) : (
          <>
            {paginatedGroups.map((group, gi) => (
              group.label ? (
                <SessionGroup
                  key={group.label}
                  label={group.label}
                  sessions={group.sessions}
                  getStation={getStation}
                  formatDuration={formatDuration}
                />
              ) : (
                <div key={`flat-${gi}`} className="space-y-2">
                  {group.sessions.map((session) => {
                    const station = getStation(session.stationId);
                    const connector = station?.connectors[0];
                    return (
                      <UnifiedSessionCard
                        key={session.id}
                        session={session}
                        station={station}
                        connector={connector}
                        formatDuration={formatDuration}
                      />
                    );
                  })}
                </div>
              )
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

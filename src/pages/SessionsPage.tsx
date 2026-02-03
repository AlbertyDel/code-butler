import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActiveSessionCard } from '@/components/sessions/ActiveSessionCard';
import { useSessions } from '@/hooks/useSessions';
import { Clock, Zap } from 'lucide-react';
import type { ChargingSession, Station, Connector } from '@/types';

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
    groupedSessions,
    stopSession,
    getStation,
    formatDuration,
  } = useSessions();

  return (
    <div className="space-y-6">
      {/* Активные сессии */}
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

      {/* История зарядных сессий */}
      <div className="space-y-4">
        <h1 className="text-xl font-bold">История зарядных сессий</h1>
        
        {groupedSessions.length === 0 ? (
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
          groupedSessions.map((group) => (
            <SessionGroup
              key={group.label}
              label={group.label}
              sessions={group.sessions}
              getStation={getStation}
              formatDuration={formatDuration}
            />
          ))
        )}
      </div>
    </div>
  );
}

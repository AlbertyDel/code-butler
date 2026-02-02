import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockSessions, mockStations } from '@/lib/mock-data';
import { ActiveSessionCard } from '@/components/sessions/ActiveSessionCard';
import { Clock, Zap, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ChargingSession } from '@/types';

function SessionStatusBadge({ status }: { status: ChargingSession['status'] }) {
  const config: Record<string, { label: string; icon: React.ElementType; className: string }> = {
    active: { label: 'Активна', icon: Zap, className: 'bg-primary text-primary-foreground' },
    completed: { label: 'Завершена', icon: CheckCircle, className: 'bg-green-500/10 text-green-600' },
    cancelled: { label: 'Отменена', icon: XCircle, className: 'bg-gray-500/10 text-gray-500' },
    error: { label: 'Ошибка', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  };

  const { label, icon: Icon, className } = config[status] || config.completed;

  return (
    <Badge variant="outline" className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  );
}

export default function SessionsPage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState(mockSessions);

  const activeSessions = sessions.filter(s => s.status === 'active');
  const completedSessions = sessions.filter(s => s.status !== 'active');

  const handleStopSession = (sessionId: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, status: 'completed' as const, endTime: new Date().toISOString() }
        : session
    ));
    toast({
      title: "Сессия остановлена",
      description: "Зарядка успешно завершена",
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Сессии</h1>
        <p className="text-muted-foreground">История зарядных сессий</p>
      </div>

      {/* Активные сессии */}
      {activeSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            Активные сессии ({activeSessions.length})
          </h2>
          {activeSessions.map((session) => {
            const station = mockStations.find(s => s.id === session.stationId);
            return (
              <ActiveSessionCard
                key={session.id}
                session={session}
                station={station}
                onStop={handleStopSession}
              />
            );
          })}
        </div>
      )}

      {/* Завершённые сессии */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">История</h2>
        {completedSessions.length === 0 ? (
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
          completedSessions.map((session) => {
            const station = mockStations.find(s => s.id === session.stationId);
            return (
              <Card key={session.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Сессия #{session.id.slice(-4)}</span>
                        <SessionStatusBadge status={session.status} />
                      </div>
                      {station && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {station.name} · {station.address}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-3 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {formatDate(session.startTime)}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          ⏱️ {formatDuration(session.startTime, session.endTime)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{session.energyKwh} кВт·ч</p>
                      <p className="text-sm text-muted-foreground">{session.cost} ₽</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

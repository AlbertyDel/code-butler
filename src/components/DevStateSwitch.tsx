import { useBusinessState, type BusinessState } from '@/contexts/BusinessStateContext';
import { useSessionFlow } from '@/contexts/SessionFlowContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { SessionFlowState } from '@/types/session-flow';

const states: { value: BusinessState; label: string; color: string }[] = [
  { value: 'promo', label: 'P', color: 'bg-muted text-foreground' },
  { value: 'pending', label: 'W', color: 'bg-amber-500 text-white' },
  { value: 'active', label: 'A', color: 'bg-primary text-primary-foreground' },
  { value: 'rejected', label: 'R', color: 'bg-destructive text-destructive-foreground' },
];

const flowStates: { value: SessionFlowState; label: string; title: string }[] = [
  { value: 'idle', label: '—', title: 'idle' },
  { value: 'waiting_for_connector', label: '🔌', title: 'waiting_for_connector' },
  { value: 'connection_recovery', label: '📶', title: 'connection_recovery' },
  { value: 'waiting_for_station_response', label: '📡', title: 'waiting_for_station_response' },
];

export function DevStateSwitch() {
  const { businessState, setBusinessState } = useBusinessState();
  const { flowState, setFlowState } = useSessionFlow();

  return (
    <div className="fixed bottom-24 right-4 z-[100] flex flex-col gap-1.5 md:bottom-4">
      {states.map((s) => (
        <button
          key={s.value}
          onClick={() => setBusinessState(s.value)}
          className={cn(
            'h-9 w-9 rounded-full text-xs font-bold shadow-lg transition-all',
            businessState === s.value
              ? cn(s.color, 'ring-2 ring-ring ring-offset-2 scale-110')
              : 'bg-card text-muted-foreground border border-border hover:scale-105'
          )}
          title={s.value}
        >
          {s.label}
        </button>
      ))}

      {/* Session flow state switcher */}
      <div className="mt-2 flex flex-col gap-1">
        <span className="text-[8px] text-muted-foreground text-center">Flow</span>
        {flowStates.map((fs) => (
          <button
            key={fs.value}
            onClick={() => setFlowState(fs.value)}
            className={cn(
              'h-7 w-9 rounded-full text-[10px] font-bold shadow-lg transition-all border',
              flowState === fs.value
                ? 'bg-primary/20 border-primary ring-1 ring-primary scale-110'
                : 'bg-card text-muted-foreground border-border hover:scale-105'
            )}
            title={fs.title}
          >
            {fs.label}
          </button>
        ))}
      </div>

      {/* Dev toast test buttons */}
      <div className="mt-2 flex flex-col gap-1">
        <button
          onClick={() => toast.success('Операция выполнена')}
          className="h-7 w-9 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold shadow-lg hover:scale-105 transition-all border border-emerald-200"
          title="Test success toast"
        >
          ✓
        </button>
        <button
          onClick={() => toast.warning('Проверьте параметры')}
          className="h-7 w-9 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold shadow-lg hover:scale-105 transition-all border border-amber-200"
          title="Test warning toast"
        >
          ⚠
        </button>
        <button
          onClick={() => toast.error('Что-то пошло не так')}
          className="h-7 w-9 rounded-full bg-red-100 text-red-700 text-[10px] font-bold shadow-lg hover:scale-105 transition-all border border-red-200"
          title="Test error toast"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

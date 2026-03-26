import { useBusinessState, type BusinessState } from '@/contexts/BusinessStateContext';
import { cn } from '@/lib/utils';

const states: { value: BusinessState; label: string; color: string }[] = [
  { value: 'promo', label: 'P', color: 'bg-muted text-foreground' },
  { value: 'pending', label: 'W', color: 'bg-amber-500 text-white' },
  { value: 'rejected', label: 'R', color: 'bg-destructive text-white' },
  { value: 'active', label: 'A', color: 'bg-primary text-primary-foreground' },
];

export function DevStateSwitch() {
  const { businessState, setBusinessState } = useBusinessState();

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
    </div>
  );
}

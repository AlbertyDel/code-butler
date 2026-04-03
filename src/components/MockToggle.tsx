import { Switch } from '@/components/ui/switch';

interface MockToggleProps {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}

export function MockToggle({ checked, onCheckedChange }: MockToggleProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/50 px-4 py-2.5 text-sm">
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
      <span className="text-muted-foreground">Тестовые данные</span>
    </div>
  );
}

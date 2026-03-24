import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const MOCK_ADDRESSES = [
  'г. Москва, ул. Тверская, д. 12, кв. 45',
  'г. Москва, Ленинградский проспект, д. 80, корп. 2',
  'г. Санкт-Петербург, Невский проспект, д. 28',
  'г. Казань, ул. Баумана, д. 5, кв. 10',
];

interface AddressComboboxProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function AddressCombobox({ value, onChange, error }: AddressComboboxProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (val: string) => {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setOpen(true);

    debounceRef.current = setTimeout(() => {
      const filtered = MOCK_ADDRESSES.filter((a) =>
        a.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered.length > 0 ? filtered : MOCK_ADDRESSES.slice(0, 3));
      setLoading(false);
    }, 600);
  };

  const selectAddress = (addr: string) => {
    onChange(addr);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => value.length >= 2 && suggestions.length > 0 && setOpen(true)}
          className={cn(error && 'border-destructive')}
        />

        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {loading ? (
            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Поиск адресов...
            </div>
          ) : (
            suggestions.map((addr, i) => (
              <button
                key={i}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent cursor-pointer transition-colors"
                onClick={() => selectAddress(addr)}
              >
                {addr}
              </button>
            ))
          )}
        </div>
      )}
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}

import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DigitInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange'> {
  onChange: (value: string) => void;
  value: string;
  error?: string;
  showSpinner?: boolean;
}

export const DigitInput = forwardRef<HTMLInputElement, DigitInputProps>(
  ({ onChange, value, error, showSpinner, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digitsOnly = e.target.value.replace(/\D/g, '');
      onChange(digitsOnly);
    };

    return (
      <div>
        <div className="relative">
          <Input
            ref={ref}
            value={value}
            onChange={handleChange}
            inputMode="numeric"
            className={cn(error && 'border-destructive', showSpinner && 'pr-10', className)}
            {...props}
          />
          {showSpinner && (
            <div className="absolute right-3 top-0 bottom-0 flex items-center justify-center pointer-events-none">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
        </div>
        {error && <p className="text-sm text-destructive mt-1">{error}</p>}
      </div>
    );
  }
);

DigitInput.displayName = 'DigitInput';

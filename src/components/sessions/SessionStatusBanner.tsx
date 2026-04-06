import { memo } from 'react';
import { AlertTriangle, Loader2, WifiOff, Cable } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BannerVariant, SessionFlowBannerConfig } from '@/types/session-flow';

interface SessionStatusBannerProps {
  config: SessionFlowBannerConfig;
  className?: string;
}

const variantStyles: Record<BannerVariant, string> = {
  warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800/50 dark:text-amber-200',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800/50 dark:text-red-200',
  progress: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-800/50 dark:text-blue-200',
};

const variantIcons: Record<BannerVariant, React.ElementType> = {
  warning: Cable,
  error: AlertTriangle,
  progress: Loader2,
};

export const SessionStatusBanner = memo(function SessionStatusBanner({
  config,
  className,
}: SessionStatusBannerProps) {
  const Icon = config.state === 'connection_recovery' ? WifiOff : variantIcons[config.variant];
  const isSpinning = config.showSpinner && config.variant === 'progress';

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3',
        variantStyles[config.variant],
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Icon
        className={cn(
          'h-5 w-5 shrink-0 mt-0.5',
          isSpinning && 'animate-spin'
        )}
      />
      <p className="text-sm font-medium leading-snug">{config.message}</p>
    </div>
  );
});

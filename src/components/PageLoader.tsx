import { memo } from 'react';
import { Zap } from 'lucide-react';

function PageLoaderComponent() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 animate-pulse">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </div>
    </div>
  );
}

export const PageLoader = memo(PageLoaderComponent);

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface PageSkeletonProps {
  /** Количество карточек-скелетонов (по умолчанию 6) */
  cards?: number;
  /** Показывать заголовок-скелетон */
  showTitle?: boolean;
}

function PageSkeletonComponent({ cards = 6, showTitle = true }: PageSkeletonProps) {
  return (
    <div className="space-y-6">
      {showTitle && <Skeleton className="h-8 w-48" />}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: cards }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5 space-y-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export const PageSkeleton = memo(PageSkeletonComponent);

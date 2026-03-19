import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet } from 'lucide-react';

export default function FinancePage() {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Финансы
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Раздел в разработке</p>
      </CardContent>
    </Card>
  );
}

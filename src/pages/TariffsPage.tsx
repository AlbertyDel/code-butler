import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Banknote } from 'lucide-react';

export default function TariffsPage() {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Тарифы
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Раздел в разработке</p>
      </CardContent>
    </Card>
  );
}

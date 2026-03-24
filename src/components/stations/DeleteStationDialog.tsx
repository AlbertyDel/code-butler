import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteStationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stationName: string;
  onConfirm: () => void;
}

export function DeleteStationDialog({ 
  open, 
  onOpenChange, 
  stationName, 
  onConfirm 
}: DeleteStationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить станцию?</AlertDialogTitle>
          <AlertDialogDescription>
            Вы уверены, что хотите удалить станцию "{stationName}"? 
            Это действие нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="w-full sm:w-auto h-11 sm:h-10">Отмена</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="w-full sm:w-auto h-11 sm:h-10 font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

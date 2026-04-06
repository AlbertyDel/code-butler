import { toast as sonnerToast } from 'sonner';

// Compatibility adapter: routes old toast({ title, description, variant }) calls to Sonner
interface LegacyToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'warning';
  [key: string]: unknown;
}

function toast(props: LegacyToastProps) {
  const { title, description, variant } = props;
  // Prefer description as the single message; fall back to title
  const message = description || title || '';

  if (variant === 'destructive') {
    sonnerToast.error(message);
  } else if (variant === 'warning') {
    sonnerToast.warning(message);
  } else {
    sonnerToast(message);
  }

  return { id: '', dismiss: () => {}, update: () => {} };
}

function useToast() {
  return {
    toast,
    dismiss: () => {},
    toasts: [],
  };
}

export { useToast, toast };

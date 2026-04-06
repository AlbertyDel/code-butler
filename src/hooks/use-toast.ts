import { toast as sonnerToast } from 'sonner';

// Compatibility adapter: routes old toast({ title, description, variant }) calls to Sonner
interface LegacyToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  [key: string]: unknown;
}

function toast(props: LegacyToastProps) {
  const { title, description, variant } = props;
  const message = title || '';
  const options = { description: description || undefined };

  if (variant === 'destructive') {
    sonnerToast.error(message, options);
  } else {
    sonnerToast.success(message, options);
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

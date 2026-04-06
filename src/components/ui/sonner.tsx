import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:!border-emerald-200 group-[.toaster]:!bg-emerald-50 group-[.toaster]:!text-emerald-900 dark:group-[.toaster]:!border-emerald-800 dark:group-[.toaster]:!bg-emerald-950 dark:group-[.toaster]:!text-emerald-100",
          error:
            "group-[.toaster]:!border-red-200 group-[.toaster]:!bg-red-50 group-[.toaster]:!text-red-900 dark:group-[.toaster]:!border-red-800 dark:group-[.toaster]:!bg-red-950 dark:group-[.toaster]:!text-red-100",
          warning:
            "group-[.toaster]:!border-amber-200 group-[.toaster]:!bg-amber-50 group-[.toaster]:!text-amber-900 dark:group-[.toaster]:!border-amber-800 dark:group-[.toaster]:!bg-amber-950 dark:group-[.toaster]:!text-amber-100",
        },
      }}
      style={
        {
          "--mobile-offset": "16px",
          "--offset": "16px",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster, toast };

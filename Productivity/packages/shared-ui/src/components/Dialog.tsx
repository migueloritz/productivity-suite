import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils';

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

const useDialog = () => {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog');
  }
  return context;
};

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open = false, onOpenChange, children }) => {
  const [internalOpen, setInternalOpen] = React.useState(open);
  
  const isControlled = onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  }, [isControlled, onOpenChange]);

  React.useEffect(() => {
    if (!isControlled) {
      setInternalOpen(open);
    }
  }, [open, isControlled]);

  const value = React.useMemo(() => ({
    open: isOpen,
    onOpenChange: handleOpenChange,
  }), [isOpen, handleOpenChange]);

  return (
    <DialogContext.Provider value={value}>
      {children}
    </DialogContext.Provider>
  );
};

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ asChild = false, onClick, ...props }, ref) => {
    const { onOpenChange } = useDialog();
    
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onOpenChange(true);
      onClick?.(event);
    };

    if (asChild && React.isValidElement(props.children)) {
      return React.cloneElement(props.children, {
        onClick: handleClick,
        ref,
        ...props,
      });
    }

    return <button ref={ref} onClick={handleClick} {...props} />;
  }
);
DialogTrigger.displayName = 'DialogTrigger';

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onPointerDownOutside?: (event: PointerEvent) => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, onPointerDownOutside, onEscapeKeyDown, ...props }, ref) => {
    const { open, onOpenChange } = useDialog();
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onEscapeKeyDown?.(event);
          if (!event.defaultPrevented) {
            onOpenChange(false);
          }
        }
      };

      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target as Element;
        if (contentRef.current && !contentRef.current.contains(target)) {
          onPointerDownOutside?.(event);
          if (!event.defaultPrevented) {
            onOpenChange(false);
          }
        }
      };

      if (open) {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('pointerdown', handlePointerDown);
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('pointerdown', handlePointerDown);
        document.body.style.overflow = '';
      };
    }, [open, onOpenChange, onEscapeKeyDown, onPointerDownOutside]);

    if (!open) return null;

    const content = (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
        <div
          ref={contentRef}
          className={cn(
            'relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    );

    return createPortal(content, document.body);
  }
);
DialogContent.displayName = 'DialogContent';

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
    {...props}
  />
));
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
));
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h1
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
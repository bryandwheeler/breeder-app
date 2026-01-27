import * as React from 'react';
import { useIsMobile } from '@/hooks/use-media-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

/**
 * ResponsiveDialog - Uses Sheet on mobile (full-screen slide-up) and Dialog on desktop
 * Provides a better mobile experience for forms and content-heavy dialogs
 */
function ResponsiveDialog({ open, onOpenChange, children }: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {children}
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

interface ResponsiveDialogContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ResponsiveDialogContent - Content wrapper that adapts to mobile/desktop
 * On mobile: Full-screen sheet sliding from bottom
 * On desktop: Centered dialog with max-width
 */
function ResponsiveDialogContent({ children, className }: ResponsiveDialogContentProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <SheetContent
        side="bottom"
        className={cn(
          'h-[95vh] flex flex-col p-0 rounded-t-xl',
          className
        )}
      >
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </SheetContent>
    );
  }

  return (
    <DialogContent
      className={cn(
        'max-w-2xl max-h-[90vh] overflow-y-auto',
        className
      )}
    >
      {children}
    </DialogContent>
  );
}

interface ResponsiveDialogHeaderProps {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

/**
 * ResponsiveDialogHeader - Sticky header on mobile, standard header on desktop
 */
function ResponsiveDialogHeader({ children, className, onClose }: ResponsiveDialogHeaderProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div
        className={cn(
          'sticky top-0 z-10 bg-white dark:bg-zinc-950 border-b px-4 py-3 flex items-center justify-between gap-2',
          className
        )}
      >
        <SheetHeader className="flex-1 space-y-0 min-w-0">
          {children}
        </SheetHeader>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-full p-3 -mr-1 hover:bg-muted active:bg-muted/80 transition-colors touch-manipulation"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
    );
  }

  return (
    <DialogHeader className={className}>
      {children}
    </DialogHeader>
  );
}

interface ResponsiveDialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ResponsiveDialogFooter - Sticky footer on mobile with safe area padding
 */
function ResponsiveDialogFooter({ children, className }: ResponsiveDialogFooterProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div
        className={cn(
          'sticky bottom-0 z-10 bg-white dark:bg-zinc-950 border-t px-4 py-3 pb-safe flex gap-2',
          className
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <DialogFooter className={className}>
      {children}
    </DialogFooter>
  );
}

interface ResponsiveDialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ResponsiveDialogTitle - Title component that works in both modes
 */
function ResponsiveDialogTitle({ children, className }: ResponsiveDialogTitleProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <SheetTitle className={cn('text-base font-semibold', className)}>
        {children}
      </SheetTitle>
    );
  }

  return (
    <DialogTitle className={className}>
      {children}
    </DialogTitle>
  );
}

interface ResponsiveDialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ResponsiveDialogDescription - Description component that works in both modes
 */
function ResponsiveDialogDescription({ children, className }: ResponsiveDialogDescriptionProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <SheetDescription className={className}>
        {children}
      </SheetDescription>
    );
  }

  return (
    <DialogDescription className={className}>
      {children}
    </DialogDescription>
  );
}

interface ResponsiveDialogBodyProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ResponsiveDialogBody - Scrollable body content area
 */
function ResponsiveDialogBody({ children, className }: ResponsiveDialogBodyProps) {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        isMobile ? 'flex-1 px-4 py-4' : '',
        className
      )}
    >
      {children}
    </div>
  );
}

export {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogFooter,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogBody,
};

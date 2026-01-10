import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-media-query';

interface CollapsibleFormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  /** Force open state (overrides internal state) */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Show a badge/indicator when collapsed (e.g., "3 items") */
  collapsedIndicator?: React.ReactNode;
  /** Additional className for the container */
  className?: string;
  /** If true, section cannot be collapsed */
  alwaysOpen?: boolean;
}

/**
 * CollapsibleFormSection - Animated collapsible section for forms
 *
 * Prevents jarring layout shifts by smoothly animating height changes.
 * Auto-collapses on mobile for sections that aren't defaultOpen.
 *
 * Usage:
 * ```tsx
 * <CollapsibleFormSection title="Breeding Rights" defaultOpen={false}>
 *   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 *     <Input label="Min Breeding Age" />
 *     <Input label="Max Litters" />
 *   </div>
 * </CollapsibleFormSection>
 * ```
 */
export function CollapsibleFormSection({
  title,
  description,
  children,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  collapsedIndicator,
  className,
  alwaysOpen = false,
}: CollapsibleFormSectionProps) {
  const isMobile = useIsMobile();

  // On mobile, default to closed unless explicitly set to open
  const effectiveDefaultOpen = defaultOpen && (!isMobile || defaultOpen);

  const [internalOpen, setInternalOpen] = React.useState(effectiveDefaultOpen);

  // Support both controlled and uncontrolled modes
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleToggle = () => {
    if (alwaysOpen) return;

    const newOpen = !isOpen;
    setInternalOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  // Ref for measuring content height for smooth animation
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = React.useState<number | 'auto'>('auto');

  // Measure content height when it changes
  React.useEffect(() => {
    if (contentRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContentHeight(entry.contentRect.height);
        }
      });
      resizeObserver.observe(contentRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition-all duration-200',
        isOpen ? 'bg-background' : 'bg-muted/30',
        className
      )}
    >
      {/* Header - always visible */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={alwaysOpen}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
          !alwaysOpen && 'hover:bg-muted/50 cursor-pointer',
          alwaysOpen && 'cursor-default'
        )}
        aria-expanded={isOpen}
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 ml-2">
          {/* Show indicator when collapsed */}
          {!isOpen && collapsedIndicator && (
            <span className="text-xs text-muted-foreground">
              {collapsedIndicator}
            </span>
          )}

          {!alwaysOpen && (
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          )}
        </div>
      </button>

      {/* Content - animated height */}
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{
          maxHeight: isOpen ? (contentHeight === 'auto' ? '9999px' : `${contentHeight}px`) : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}

interface FormSectionGroupProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * FormSectionGroup - Container for multiple CollapsibleFormSection components
 * Provides consistent spacing between sections
 */
export function FormSectionGroup({ children, className }: FormSectionGroupProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {children}
    </div>
  );
}

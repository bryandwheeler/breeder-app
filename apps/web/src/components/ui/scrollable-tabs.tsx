import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-media-query';

/**
 * ScrollableTabsList - A TabsList that scrolls horizontally on mobile
 * Shows fade indicators on the edges when content is scrollable
 */
const ScrollableTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
  const isMobile = useIsMobile();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = React.useState(false);
  const [showRightFade, setShowRightFade] = React.useState(false);

  const updateFadeIndicators = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftFade(scrollLeft > 0);
    setShowRightFade(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Initial check
    updateFadeIndicators();

    // Update on scroll
    container.addEventListener('scroll', updateFadeIndicators, { passive: true });

    // Update on resize
    const resizeObserver = new ResizeObserver(updateFadeIndicators);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', updateFadeIndicators);
      resizeObserver.disconnect();
    };
  }, [updateFadeIndicators]);

  if (!isMobile) {
    // Desktop: render standard TabsList
    return (
      <TabsPrimitive.List
        ref={ref}
        className={cn(
          'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
          className
        )}
        {...props}
      >
        {children}
      </TabsPrimitive.List>
    );
  }

  // Mobile: render scrollable container with fade indicators
  return (
    <div className="relative">
      {/* Left fade indicator */}
      {showLeftFade && (
        <div
          className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Right fade indicator */}
      {showRightFade && (
        <div
          className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide -mx-1 px-1"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <TabsPrimitive.List
          ref={ref}
          className={cn(
            'inline-flex h-10 items-center rounded-md bg-muted p-1 text-muted-foreground w-max min-w-full',
            className
          )}
          {...props}
        >
          {children}
        </TabsPrimitive.List>
      </div>
    </div>
  );
});
ScrollableTabsList.displayName = 'ScrollableTabsList';

/**
 * ScrollableTabsTrigger - Tab trigger with touch-friendly sizing on mobile
 */
const ScrollableTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
      // Mobile: larger touch targets
      'min-h-[36px] md:min-h-0',
      className
    )}
    {...props}
  />
));
ScrollableTabsTrigger.displayName = 'ScrollableTabsTrigger';

export { ScrollableTabsList, ScrollableTabsTrigger };

// Re-export Tabs and TabsContent from the original tabs component
export { Tabs, TabsContent } from '@/components/ui/tabs';

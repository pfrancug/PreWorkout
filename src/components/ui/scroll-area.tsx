'use client';

import { cn } from '@lib/utils';
import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui';
import * as React from 'react';

const ScrollArea = ({
  className,
  children,
  viewportRef,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root> & {
  viewportRef?: React.Ref<HTMLDivElement>;
}) => {
  return (
    <ScrollAreaPrimitive.Root
      className={cn('relative overflow-hidden', className)}
      data-slot={'scroll-area'}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot={'scroll-area-viewport'}
        ref={viewportRef}
        className={
          'focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1 [&>div]:!block [&>div]:!w-full'
        }
      >
        {children}
      </ScrollAreaPrimitive.Viewport>

      <ScrollBar />

      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
};

const ScrollBar = ({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) => {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot={'scroll-area-scrollbar'}
      orientation={orientation}
      className={cn(
        'flex touch-none p-px transition-colors select-none',
        orientation === 'vertical' &&
          'h-full w-2.5 border-l border-l-transparent',
        orientation === 'horizontal' &&
          'h-2.5 flex-col border-t border-t-transparent',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        className={'bg-border relative flex-1 rounded-full'}
        data-slot={'scroll-area-thumb'}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
};

export { ScrollArea, ScrollBar };

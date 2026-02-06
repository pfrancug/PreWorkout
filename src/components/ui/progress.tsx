import type { ComponentProps } from 'react';

import { cn } from '@lib/utils';
import { Progress as ProgressPrimitive } from 'radix-ui';

const Progress = ({
  className,
  value,
  indicatorClassName,
  ...props
}: ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string;
}) => {
  return (
    <ProgressPrimitive.Root
      data-slot={'progress'}
      className={cn(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot={'progress-indicator'}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        className={cn(
          'bg-primary h-full w-full flex-1 transition-all',
          indicatorClassName,
        )}
      />
    </ProgressPrimitive.Root>
  );
};

export { Progress };

import type { ComponentProps } from 'react';

import { cn } from '@lib/utils';
import { Switch as SwitchPrimitive } from 'radix-ui';

interface SwitchProps extends ComponentProps<typeof SwitchPrimitive.Root> {
  size?: 'default' | 'sm';
}

const Switch = ({ className, size = 'default', ...props }: SwitchProps) => (
  <SwitchPrimitive.Root
    data-slot={'switch'}
    className={cn(
      'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80 focus-visible:border-ring focus-visible:ring-ring/50 inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
      size === 'sm' ? 'h-3.5 w-6' : 'h-5 w-9',
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      data-slot={'switch-thumb'}
      className={cn(
        'bg-background pointer-events-none block rounded-full shadow-lg ring-0 transition-transform data-[state=unchecked]:translate-x-0',
        size === 'sm'
          ? 'size-2.5 data-[state=checked]:translate-x-2.5'
          : 'size-4 data-[state=checked]:translate-x-4',
      )}
    />
  </SwitchPrimitive.Root>
);

export { Switch };

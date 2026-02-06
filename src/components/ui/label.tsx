import type { ComponentProps } from 'react';

import { cn } from '@lib/utils';

const Label = ({ className, ...props }: ComponentProps<'label'>) => {
  return (
    <label
      data-slot={'label'}
      className={cn(
        'cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  );
};

export { Label };

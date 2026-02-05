import { cn } from '@lib/utils';
import * as React from 'react';

const Label = ({ className, ...props }: React.ComponentProps<'label'>) => {
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

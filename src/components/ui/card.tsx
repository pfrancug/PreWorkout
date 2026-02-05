import { cn } from '@lib/utils';
import * as React from 'react';

const Card = ({ className, ...props }: React.ComponentProps<'div'>) => {
  return (
    <div
      data-slot={'card'}
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
        className,
      )}
      {...props}
    />
  );
};

const CardHeader = ({ className, ...props }: React.ComponentProps<'div'>) => {
  return (
    <div
      data-slot={'card-header'}
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  );
};

const CardTitle = ({ className, ...props }: React.ComponentProps<'div'>) => {
  return (
    <div
      className={cn('leading-none font-semibold', className)}
      data-slot={'card-title'}
      {...props}
    />
  );
};

const CardDescription = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => {
  return (
    <div
      className={cn('text-muted-foreground text-sm', className)}
      data-slot={'card-description'}
      {...props}
    />
  );
};

const CardAction = ({ className, ...props }: React.ComponentProps<'div'>) => {
  return (
    <div
      data-slot={'card-action'}
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className,
      )}
      {...props}
    />
  );
};

const CardContent = ({ className, ...props }: React.ComponentProps<'div'>) => {
  return (
    <div
      className={cn('px-6', className)}
      data-slot={'card-content'}
      {...props}
    />
  );
};

const CardFooter = ({ className, ...props }: React.ComponentProps<'div'>) => {
  return (
    <div
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      data-slot={'card-footer'}
      {...props}
    />
  );
};

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};

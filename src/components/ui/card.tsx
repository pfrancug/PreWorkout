import type { ComponentProps } from 'react';

import { cn } from '@lib/utils';

const Card = ({ className, ...props }: ComponentProps<'div'>) => {
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

const CardHeader = ({ className, ...props }: ComponentProps<'div'>) => {
  return (
    <div
      data-slot={'card-header'}
      className={cn(
        '@container/card-header flex flex-wrap items-start gap-2 px-6 [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  );
};

const CardTitle = ({ className, ...props }: ComponentProps<'div'>) => {
  return (
    <div
      className={cn('leading-none font-semibold', className)}
      data-slot={'card-title'}
      {...props}
    />
  );
};

const CardDescription = ({ className, ...props }: ComponentProps<'div'>) => {
  return (
    <div
      className={cn('text-muted-foreground text-sm', className)}
      data-slot={'card-description'}
      {...props}
    />
  );
};

const CardAction = ({ className, ...props }: ComponentProps<'div'>) => {
  return (
    <div
      className={cn('ml-auto self-start', className)}
      data-slot={'card-action'}
      {...props}
    />
  );
};

const CardContent = ({ className, ...props }: ComponentProps<'div'>) => {
  return (
    <div
      className={cn('px-6', className)}
      data-slot={'card-content'}
      {...props}
    />
  );
};

const CardFooter = ({ className, ...props }: ComponentProps<'div'>) => {
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

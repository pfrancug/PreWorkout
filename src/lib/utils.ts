import type { ClassValue } from 'clsx';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const dateFormatter = Intl.DateTimeFormat(undefined, {
  month: '2-digit',
  day: '2-digit',
});

import type { ActivityIconId } from '../constants/activities';

import { cn } from '@lib/utils';
import { useTranslation } from 'react-i18next';

import {
  ACTIVITY_COLOR_MAP,
  ACTIVITY_COLORS,
  AVAILABLE_ICONS,
} from '../constants/activities';
import { ActivityIcon } from './ActivityIcon';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface IconColorPickerProps {
  icon: string;
  color: string;
  onIconChange: (icon: ActivityIconId) => void;
  onColorChange: (color: string) => void;
}

export const IconColorPicker = ({
  icon,
  color,
  onIconChange,
  onColorChange,
}: IconColorPickerProps) => {
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type={'button'}
          className={
            'flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-card transition-colors hover:bg-accent'
          }
        >
          <ActivityIcon
            className={'h-5 w-5'}
            iconId={icon}
            style={{ color: ACTIVITY_COLOR_MAP[color] }}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent align={'start'} className={'w-auto p-3'}>
        <p className={'mb-2 text-xs font-medium text-muted-foreground'}>
          {t('settings.categories.pickColor')}
        </p>

        <div className={'mb-3 grid grid-cols-5 gap-2'}>
          {ACTIVITY_COLORS.map(({ id, hex }) => (
            <button
              key={id}
              onClick={() => onColorChange(id)}
              type={'button'}
              className={cn(
                'flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-colors hover:bg-accent',
                color === id ? 'border-primary bg-primary/10' : 'border-border',
              )}
            >
              <span
                className={'h-5 w-5 rounded-sm'}
                style={{ backgroundColor: hex }}
              />
            </button>
          ))}
        </div>

        <p className={'mb-2 text-xs font-medium text-muted-foreground'}>
          {t('settings.categories.pickIcon')}
        </p>

        <div className={'grid grid-cols-5 gap-2'}>
          {AVAILABLE_ICONS.map(({ id, icon: Icon, label }) => (
            // Intentionally does NOT close the popover — users often pick
            // an icon and then switch the color, so keeping it open avoids
            // having to re-open the picker.
            <button
              key={id}
              title={label}
              type={'button'}
              className={cn(
                'flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-colors hover:bg-accent',
                icon === id ? 'border-primary bg-primary/10' : 'border-border',
              )}
              onClick={() => {
                onIconChange(id);
              }}
            >
              <Icon
                className={'h-5 w-5'}
                style={{ color: ACTIVITY_COLOR_MAP[color] }}
              />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

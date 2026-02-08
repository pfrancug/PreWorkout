import type { ComponentProps } from 'react';

import { Dumbbell } from 'lucide-react';
import { memo } from 'react';

import { AVAILABLE_ICONS } from '../constants/activities';

const ICON_MAP: Record<string, typeof Dumbbell> = Object.fromEntries(
  AVAILABLE_ICONS.map(({ id, icon }) => [id, icon]),
);

export const ActivityIcon = memo(function ActivityIcon({
  iconId,
  ...props
}: { iconId: string } & ComponentProps<typeof Dumbbell>) {
  const Icon = ICON_MAP[iconId] ?? Dumbbell;

  return <Icon {...props} />;
});

import type { IUserWithLimits } from './types';
import type { MessageLimitMode } from '@firebase-config/database';

import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Switch } from '@components/ui/switch';
import { TableCell, TableRow } from '@components/ui/table';
import { EM_DASH } from '@constants/display';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AdminUserRowProps {
  user: IUserWithLimits;
  isSaving: boolean;
  isTogglingTrainer: boolean;
  onLimitModeChange: (uid: string, mode: MessageLimitMode) => void;
  onTrainerToggle: (uid: string, currentIsTrainer: boolean) => void;
}

export const AdminUserRow = ({
  user,
  isSaving,
  isTogglingTrainer,
  onLimitModeChange,
  onTrainerToggle,
}: AdminUserRowProps) => {
  const { t } = useTranslation();

  return (
    <TableRow>
      <TableCell>
        <Avatar className={'h-8 w-8 rounded-lg'}>
          <AvatarImage
            alt={user.displayName ?? ''}
            src={user.avatarUrl ?? undefined}
          />
          <AvatarFallback className={'rounded-lg text-xs'}>
            {(user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </TableCell>

      <TableCell className={'font-mono text-sm'}>
        {user.email ?? (
          <span className={'text-muted-foreground italic'}>
            {t('admin.users.deleted')}
          </span>
        )}
      </TableCell>

      <TableCell>
        {user.displayName ?? (
          <span className={'text-muted-foreground'}>{EM_DASH}</span>
        )}
      </TableCell>

      <TableCell className={'text-sm'}>
        {user.lastLogin ? (
          new Date(user.lastLogin).toLocaleDateString()
        ) : (
          <span className={'text-muted-foreground'}>{EM_DASH}</span>
        )}
      </TableCell>

      <TableCell className={'text-sm font-medium'}>
        {user.stats?.allTimeTotal ?? (
          <span className={'text-muted-foreground'}>{EM_DASH}</span>
        )}
      </TableCell>

      <TableCell className={'text-sm font-medium'}>
        {user.stats?.totalMessages ?? (
          <span className={'text-muted-foreground'}>{EM_DASH}</span>
        )}
      </TableCell>

      <TableCell className={'text-sm font-medium'}>
        {user.stats?.todayMessages ?? (
          <span className={'text-muted-foreground'}>{EM_DASH}</span>
        )}
      </TableCell>

      <TableCell>
        <Select
          disabled={isSaving}
          value={user.limitMode}
          onValueChange={(value: MessageLimitMode) =>
            onLimitModeChange(user.uid, value)
          }
        >
          <SelectTrigger
            aria-label={t('admin.analytics.limitMode')}
            className={'w-28 h-8'}
          >
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value={'disabled'}>
              {t('admin.limitModes.disabled')}
            </SelectItem>

            <SelectItem value={'limited'}>
              {t('admin.limitModes.limited')}
            </SelectItem>

            <SelectItem value={'unlimited'}>
              {t('admin.limitModes.unlimited')}
            </SelectItem>
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell>
        {isTogglingTrainer ? (
          <Loader2 className={'h-4 w-4 animate-spin'} />
        ) : (
          <Switch
            checked={user.isTrainer ?? false}
            disabled={user.deleted}
            onCheckedChange={() =>
              onTrainerToggle(user.uid, user.isTrainer ?? false)
            }
          />
        )}
      </TableCell>
    </TableRow>
  );
};

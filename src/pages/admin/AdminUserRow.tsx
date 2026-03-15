import type { IUserWithLimits } from './types';

import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Switch } from '@components/ui/switch';
import { TableCell, TableRow } from '@components/ui/table';
import { Loader2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AdminUserRowProps {
  user: IUserWithLimits;
  currentMax: string;
  isEditing: boolean;
  isSaving: boolean;
  isTogglingTrainer: boolean;
  onLimitChange: (uid: string, value: string) => void;
  onLimitSave: (uid: string) => void;
  onTrainerToggle: (uid: string, currentIsTrainer: boolean) => void;
}

export const AdminUserRow = ({
  user,
  currentMax,
  isEditing,
  isSaving,
  isTogglingTrainer,
  onLimitChange,
  onLimitSave,
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
          <span className={'text-muted-foreground'}>{'-'}</span>
        )}
      </TableCell>

      <TableCell className={'text-sm'}>
        {user.lastLogin ? (
          new Date(user.lastLogin).toLocaleDateString()
        ) : (
          <span className={'text-muted-foreground'}>{'-'}</span>
        )}
      </TableCell>

      <TableCell className={'text-sm font-medium'}>
        {user.stats?.allTimeTotal ?? (
          <span className={'text-muted-foreground'}>{'-'}</span>
        )}
      </TableCell>

      <TableCell className={'text-sm font-medium'}>
        {user.stats?.totalMessages ?? (
          <span className={'text-muted-foreground'}>{'-'}</span>
        )}
      </TableCell>

      <TableCell className={'text-sm font-medium'}>
        {user.stats?.todayMessages ?? (
          <span className={'text-muted-foreground'}>{'-'}</span>
        )}
      </TableCell>

      <TableCell>
        <Label className={'sr-only'} htmlFor={`limit-${user.uid}`}>
          {t('admin.analytics.maxLimit')}
        </Label>

        <Input
          className={'w-20 h-8'}
          id={`limit-${user.uid}`}
          min={-1}
          onChange={(e) => onLimitChange(user.uid, e.target.value)}
          type={'number'}
          value={currentMax}
        />
      </TableCell>

      <TableCell>
        <Button
          className={'h-8'}
          disabled={!isEditing || isSaving}
          onClick={() => onLimitSave(user.uid)}
          size={'sm'}
          variant={'outline'}
        >
          {isSaving ? (
            <Loader2 className={'h-3.5 w-3.5 animate-spin'} />
          ) : (
            <Save className={'h-3.5 w-3.5'} />
          )}
        </Button>
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

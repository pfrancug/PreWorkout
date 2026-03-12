import type { ITrainerConnection } from '../../types/types';

import { Button } from '@components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Skeleton } from '@components/ui/skeleton';
import { ClipboardCopy, Trash2, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useAuth } from '../../contexts/useAuth';
import {
  createTrainerInvite,
  deletePendingInvite,
  subscribeToTrainerConnections,
  updateConnectionNote,
} from '../../firebase/database';

// ── Invite Card ───────────────────────────────────────────────────────────

const InviteCard = ({
  connection,
  onDelete,
}: {
  connection: ITrainerConnection;
  onDelete: (conn: ITrainerConnection) => void;
}) => {
  const { t } = useTranslation();
  const [note, setNote] = useState(connection.note || '');
  const [deleting, setDeleting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync note from props when the subscription delivers a new value
  // (e.g. edited on another device), but only if no local edit is pending
  useEffect(() => {
    if (!debounceRef.current) {
      setNote(connection.note || '');
    }
  }, [connection.note]);

  const handleNoteChange = useCallback(
    (value: string) => {
      setNote(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        updateConnectionNote(connection.id, value);
        debounceRef.current = null;
      }, 600);
    },
    [connection.id],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleCopy = () => {
    const url = `${window.location.origin}/invite#${connection.inviteCode}`;
    navigator.clipboard.writeText(url);
    toast.success(t('settings.trainer.copied'));
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(t('settings.trainer.deleteInviteConfirm'));
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    try {
      await onDelete(connection);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={'rounded-lg border p-4 space-y-3'}>
      <div className={'flex items-center gap-2'}>
        <div
          className={
            'bg-muted flex-1 rounded-md border px-4 py-2 font-mono text-lg tracking-widest text-center select-all'
          }
        >
          {connection.inviteCode}
        </div>

        <Button
          aria-label={t('common.copy')}
          onClick={handleCopy}
          size={'icon'}
          variant={'outline'}
        >
          <ClipboardCopy className={'h-4 w-4'} />
        </Button>

        <Button
          aria-label={t('common.delete')}
          disabled={deleting}
          onClick={handleDelete}
          size={'icon'}
          variant={'ghost'}
        >
          <Trash2 className={'h-4 w-4 text-destructive'} />
        </Button>
      </div>

      <Input
        onChange={(e) => handleNoteChange(e.target.value)}
        placeholder={t('settings.trainer.notePlaceholder')}
        value={note}
      />
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────

export const TrainerInvitesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [connections, setConnections] = useState<ITrainerConnection[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = subscribeToTrainerConnections(user.uid, (conns) => {
      setConnections(conns);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  if (!user) {
    return null;
  }

  const pendingConnections = connections.filter((c) => c.status === 'pending');

  const handleGenerateInvite = async () => {
    setGenerating(true);
    try {
      await createTrainerInvite(user.uid);
    } catch {
      toast.error(t('settings.trainer.connectError'));
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteInvite = async (connection: ITrainerConnection) => {
    try {
      await deletePendingInvite(connection.id);
      toast.success(t('settings.trainer.deleteInviteSuccess'));
    } catch {
      toast.error(t('settings.trainer.deleteInviteError'));
    }
  };

  return (
    <div
      className={
        'mx-auto w-full max-w-3xl flex flex-1 flex-col gap-4 p-4 lg:gap-8 lg:p-6'
      }
    >
      <div className={'space-y-1'}>
        <h1 className={'text-3xl font-bold tracking-tight'}>
          {t('settings.trainer.invitesPageTitle')}
        </h1>

        <p className={'text-muted-foreground'}>
          {t('settings.trainer.invitesPageDescription')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.trainer.manageTrainees')}</CardTitle>
          <CardDescription>
            {t('settings.trainer.manageTraineesDescription')}
          </CardDescription>
        </CardHeader>

        <CardContent className={'space-y-4'}>
          <Button disabled={generating} onClick={handleGenerateInvite}>
            <UserPlus className={'mr-2 h-4 w-4'} />
            {t('settings.trainer.generateInvite')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.trainer.pendingInvites')}</CardTitle>
          <CardDescription>
            {t('settings.trainer.inviteCodeInfo')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className={'space-y-3'}>
              <Skeleton className={'h-24 w-full'} />
            </div>
          ) : pendingConnections.length === 0 ? (
            <p className={'text-sm text-muted-foreground text-center py-6'}>
              {t('settings.trainer.noPendingInvites')}
            </p>
          ) : (
            <div className={'space-y-3'}>
              {pendingConnections.map((conn) => (
                <InviteCard
                  connection={conn}
                  key={conn.id}
                  onDelete={handleDeleteInvite}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

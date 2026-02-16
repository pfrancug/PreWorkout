import type { ITrainerConnection } from '../../types/types';

import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Separator } from '@components/ui/separator';
import { Skeleton } from '@components/ui/skeleton';
import { ClipboardCopy, Link2Off, Trash2, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useAuth } from '../../contexts/useAuth';
import {
  acceptTrainerInvite,
  createTrainerInvite,
  deletePendingInvite,
  disconnectTrainer,
  getUserAvatarUrl,
  getUserDirectoryEntry,
  subscribeToTraineeConnection,
  subscribeToTrainerConnections,
  updateConnectionNote,
  type UserDirectoryEntry,
} from '../../firebase/database';

// ── Trainee View ──────────────────────────────────────────────────────────

const TraineeView = ({ userId }: { userId: string }) => {
  const { t } = useTranslation();
  const [inviteCode, setInviteCode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connection, setConnection] = useState<ITrainerConnection | null>(null);
  const [trainerInfo, setTrainerInfo] = useState<UserDirectoryEntry | null>(
    null,
  );
  const [trainerAvatar, setTrainerAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Pre-fill invite code from URL hash (e.g. /settings/trainer#ABC123)
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setInviteCode(hash.toUpperCase());
      // Clean the hash from URL without triggering navigation
      history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToTraineeConnection(userId, (conn) => {
      setConnection(conn);
      setLoading(false);

      if (conn) {
        getUserDirectoryEntry(conn.trainerId).then(setTrainerInfo);
        getUserAvatarUrl(conn.trainerId).then(setTrainerAvatar);
      } else {
        setTrainerInfo(null);
        setTrainerAvatar(null);
      }
    });

    return unsubscribe;
  }, [userId]);

  const handleConnect = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      return;
    }

    setConnecting(true);

    try {
      const result = await acceptTrainerInvite(userId, code);

      if (result.success) {
        toast.success(t('settings.trainer.connectSuccess'));
        setInviteCode('');
      } else {
        const errorKey =
          result.error === 'invalid_code'
            ? 'invalidCode'
            : result.error === 'already_has_trainer'
              ? 'alreadyHasTrainer'
              : result.error === 'invite_already_used'
                ? 'inviteAlreadyUsed'
                : 'connectError';
        toast.error(t(`settings.trainer.${errorKey}`));
      }
    } catch {
      toast.error(t('settings.trainer.connectError'));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) {
      return;
    }

    const confirmed = window.confirm(t('settings.trainer.disconnectConfirm'));
    if (!confirmed) {
      return;
    }

    setDisconnecting(true);

    try {
      await disconnectTrainer(connection.id, userId);
      toast.success(t('settings.trainer.disconnectSuccess'));
    } catch {
      toast.error(t('settings.trainer.disconnectError'));
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className={'h-6 w-40'} />
          <Skeleton className={'h-4 w-64'} />
        </CardHeader>
        <CardContent>
          <Skeleton className={'h-10 w-full'} />
        </CardContent>
      </Card>
    );
  }

  if (connection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.trainer.yourTrainer')}</CardTitle>
          <CardDescription>
            {t('settings.trainer.yourTrainerDescription')}
          </CardDescription>
        </CardHeader>

        <CardContent className={'space-y-4'}>
          <div className={'flex items-center justify-between'}>
            <div className={'flex items-center gap-3'}>
              <Avatar className={'h-10 w-10 rounded-lg'}>
                <AvatarImage
                  alt={trainerInfo?.displayName || ''}
                  src={trainerAvatar || undefined}
                />
                <AvatarFallback className={'rounded-lg'}>
                  {(trainerInfo?.displayName || '?').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <p className={'font-medium'}>
                {trainerInfo?.displayName || t('settings.trainer.unknownUser')}
              </p>
            </div>

            <Badge variant={'default'}>{t('settings.trainer.active')}</Badge>
          </div>

          <Separator />

          <Button
            disabled={disconnecting}
            onClick={handleDisconnect}
            variant={'destructive'}
          >
            <Link2Off className={'mr-2 h-4 w-4'} />
            {t('settings.trainer.disconnect')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.trainer.connectTrainer')}</CardTitle>
        <CardDescription>
          {t('settings.trainer.noTrainerDescription')}
        </CardDescription>
      </CardHeader>

      <CardContent className={'space-y-4'}>
        <div className={'flex gap-2'}>
          <Input
            maxLength={6}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder={t('settings.trainer.inviteCodePlaceholder')}
            value={inviteCode}
          />

          <Button
            disabled={!inviteCode.trim() || connecting}
            onClick={handleConnect}
          >
            <UserPlus className={'mr-2 h-4 w-4'} />
            {t('settings.trainer.connect')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

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

  const handleNoteChange = useCallback(
    (value: string) => {
      setNote(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        updateConnectionNote(connection.id, value);
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

        <Button onClick={handleCopy} size={'icon'} variant={'outline'}>
          <ClipboardCopy className={'h-4 w-4'} />
        </Button>

        <Button
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

// ── Trainer View ──────────────────────────────────────────────────────────

const TrainerView = ({ userId }: { userId: string }) => {
  const { t } = useTranslation();
  const [connections, setConnections] = useState<ITrainerConnection[]>([]);
  const [traineesInfo, setTraineesInfo] = useState<
    Record<string, UserDirectoryEntry | null>
  >({});
  const [traineesAvatars, setTraineesAvatars] = useState<
    Record<string, string | null>
  >({});
  const [generating, setGenerating] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToTrainerConnections(userId, (conns) => {
      setConnections(conns);
      setLoading(false);

      conns.forEach((conn) => {
        if (conn.traineeId) {
          getUserDirectoryEntry(conn.traineeId).then((info) => {
            setTraineesInfo((prev) => ({ ...prev, [conn.traineeId]: info }));
          });
          getUserAvatarUrl(conn.traineeId).then((url) => {
            setTraineesAvatars((prev) => ({ ...prev, [conn.traineeId]: url }));
          });
        }
      });
    });

    return unsubscribe;
  }, [userId]);

  const handleGenerateInvite = async () => {
    setGenerating(true);
    try {
      await createTrainerInvite(userId);
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

  const handleRemoveTrainee = async (connection: ITrainerConnection) => {
    const confirmed = window.confirm(
      t('settings.trainer.removeTraineeConfirm'),
    );
    if (!confirmed) {
      return;
    }

    setRemovingId(connection.id);
    try {
      await disconnectTrainer(connection.id, connection.traineeId);
      toast.success(t('settings.trainer.removeSuccess'));
    } catch {
      toast.error(t('settings.trainer.removeError'));
    } finally {
      setRemovingId(null);
    }
  };

  const activeConnections = connections.filter((c) => c.status === 'active');
  const pendingConnections = connections.filter((c) => c.status === 'pending');

  return (
    <>
      {/* Invite Codes Card */}
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

      {/* Pending Invites Card */}
      {(pendingConnections.length > 0 || loading) && (
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
      )}

      {/* Connected Trainees Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.trainer.connectedTrainees')}</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className={'space-y-3'}>
              <Skeleton className={'h-12 w-full'} />
              <Skeleton className={'h-12 w-full'} />
            </div>
          ) : activeConnections.length === 0 ? (
            <div className={'text-center py-6'}>
              <p className={'text-muted-foreground'}>
                {t('settings.trainer.noTrainees')}
              </p>
              <p className={'text-sm text-muted-foreground mt-1'}>
                {t('settings.trainer.noTraineesDescription')}
              </p>
            </div>
          ) : (
            <div className={'space-y-2'}>
              {activeConnections.map((conn) => {
                const info = conn.traineeId
                  ? traineesInfo[conn.traineeId]
                  : null;

                return (
                  <div
                    key={conn.id}
                    className={
                      'flex items-center justify-between rounded-lg border p-3'
                    }
                  >
                    <div className={'flex items-center gap-3'}>
                      <Avatar className={'h-8 w-8 rounded-lg'}>
                        <AvatarImage
                          alt={info?.displayName || ''}
                          src={
                            (conn.traineeId &&
                              traineesAvatars[conn.traineeId]) ||
                            undefined
                          }
                        />
                        <AvatarFallback className={'rounded-lg'}>
                          {(info?.displayName || '?').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <p className={'font-medium'}>
                        {info?.displayName || t('settings.trainer.unknownUser')}
                      </p>
                    </div>

                    <div className={'flex items-center gap-2'}>
                      <Badge variant={'default'}>
                        {t('settings.trainer.active')}
                      </Badge>

                      <Button
                        disabled={removingId === conn.id}
                        onClick={() => handleRemoveTrainee(conn)}
                        size={'sm'}
                        variant={'ghost'}
                      >
                        <Trash2 className={'h-4 w-4 text-destructive'} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────

export const TrainerSettingsPage = () => {
  const { t } = useTranslation();
  const { user, isTrainer } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div
      className={
        'mx-auto w-full max-w-3xl flex flex-1 flex-col gap-4 p-4 lg:gap-8 lg:p-6'
      }
    >
      <div className={'space-y-1'}>
        <h1 className={'text-3xl font-bold tracking-tight'}>
          {t('settings.trainer.pageTitle')}
        </h1>

        <p className={'text-muted-foreground'}>
          {t('settings.trainer.pageDescription')}
        </p>
      </div>

      {/* Every user can connect to a trainer (trainee side) */}
      <TraineeView userId={user.uid} />

      {/* Only trainers see the management section */}
      {isTrainer && <TrainerView userId={user.uid} />}
    </div>
  );
};

import type { ITrainerConnection } from '../../types/types';

import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Skeleton } from '@components/ui/skeleton';
import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useAuth } from '../../contexts/useAuth';
import {
  disconnectTrainer,
  getUserAvatarUrl,
  getUserDirectoryEntry,
  subscribeToTrainerConnections,
  type UserDirectoryEntry,
} from '../../firebase/database';

export const TrainerConnectedPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [connections, setConnections] = useState<ITrainerConnection[]>([]);
  const [traineesInfo, setTraineesInfo] = useState<
    Record<string, UserDirectoryEntry | null>
  >({});
  const [traineesAvatars, setTraineesAvatars] = useState<
    Record<string, string | null>
  >({});
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = subscribeToTrainerConnections(user.uid, (conns) => {
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
  }, [user]);

  if (!user) {
    return null;
  }

  const activeConnections = connections.filter((c) => c.status === 'active');

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

  return (
    <div
      className={
        'mx-auto w-full max-w-3xl flex flex-1 flex-col gap-4 p-4 lg:gap-8 lg:p-6'
      }
    >
      <div className={'space-y-1'}>
        <h1 className={'text-3xl font-bold tracking-tight'}>
          {t('settings.trainer.connectedPageTitle')}
        </h1>

        <p className={'text-muted-foreground'}>
          {t('settings.trainer.connectedPageDescription')}
        </p>
      </div>

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
    </div>
  );
};

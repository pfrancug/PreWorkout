import { Skeleton } from '@components/ui/skeleton';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TrainingSessions } from '../../components/TrainingSessions';
import { useAuth } from '../../contexts/useAuth';
import { subscribeToTraineeConnection } from '../../firebase/database';

export const TrainerSessionsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = subscribeToTraineeConnection(user.uid, (conn) => {
      setConnectionId(conn?.id ?? null);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

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
          {t('settings.trainer.sessionsPageTitle')}
        </h1>

        <p className={'text-muted-foreground'}>
          {t('settings.trainer.sessionsPageDescription')}
        </p>
      </div>

      {loading ? (
        <Skeleton className={'h-40 w-full'} />
      ) : connectionId ? (
        <TrainingSessions connectionId={connectionId} role={'trainee'} />
      ) : (
        <p className={'text-muted-foreground'}>
          {t('settings.trainer.noTrainer')}
        </p>
      )}
    </div>
  );
};

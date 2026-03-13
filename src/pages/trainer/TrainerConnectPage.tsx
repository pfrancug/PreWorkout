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
import { Link2Off, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useAuth } from '../../contexts/useAuth';
import {
  acceptTrainerInvite,
  disconnectTrainer,
  getUserAvatarUrl,
  getUserDisplayName,
  subscribeToTraineeConnection,
} from '../../firebase/database';

export const TrainerConnectPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connection, setConnection] = useState<ITrainerConnection | null>(null);
  const [trainerName, setTrainerName] = useState<string | null>(null);
  const [trainerAvatar, setTrainerAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Pre-fill invite code from URL hash (e.g. /trainer/connect#ABC123)
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setInviteCode(hash.toUpperCase());
      history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = subscribeToTraineeConnection(user.uid, (conn) => {
      setConnection(conn);
      setLoading(false);

      if (conn) {
        getUserDisplayName(conn.trainerId)
          .then(setTrainerName)
          .catch(() => {});
        getUserAvatarUrl(conn.trainerId)
          .then(setTrainerAvatar)
          .catch(() => {});
      } else {
        setTrainerName(null);
        setTrainerAvatar(null);
      }
    });

    return unsubscribe;
  }, [user]);

  if (!user) {
    return null;
  }

  const handleConnect = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      return;
    }

    setConnecting(true);

    try {
      const result = await acceptTrainerInvite(user.uid, code);

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
      await disconnectTrainer(connection.id, user.uid);
      toast.success(t('settings.trainer.disconnectSuccess'));
    } catch {
      toast.error(t('settings.trainer.disconnectError'));
    } finally {
      setDisconnecting(false);
    }
  };

  const renderContent = () => {
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
        <>
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
                      alt={trainerName || ''}
                      src={trainerAvatar || undefined}
                    />
                    <AvatarFallback className={'rounded-lg'}>
                      {(trainerName || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <p className={'font-medium'}>
                    {trainerName || t('settings.trainer.unknownUser')}
                  </p>
                </div>

                <Badge variant={'default'}>
                  {t('settings.trainer.active')}
                </Badge>
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
        </>
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

  return (
    <div
      className={
        'mx-auto w-full max-w-3xl flex flex-1 flex-col gap-4 p-4 lg:gap-8 lg:p-6'
      }
    >
      <div className={'space-y-1'}>
        <h1 className={'text-3xl font-bold tracking-tight'}>
          {t('settings.trainer.connectPageTitle')}
        </h1>

        <p className={'text-muted-foreground'}>
          {t('settings.trainer.connectPageDescription')}
        </p>
      </div>

      {renderContent()}
    </div>
  );
};

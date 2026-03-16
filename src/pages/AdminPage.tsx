import type { IUserWithLimits } from './admin/types';
import type { IUserDirectoryEntry } from '@firebase-config/database';
import type { MessageLimitMode } from '@firebase-config/database';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { useAuth } from '@contexts/useAuth';
import { auth as firebaseAuth } from '@firebase-config/auth';
import {
  getTrainerFlagFromDirectory,
  getUserAvatarUrl,
  getUserLimitModeForAdmin,
  getUserUsageStats,
  setTrainerFlagInDirectory,
  setUserLimitModeForAdmin,
  subscribeToUserDirectory,
} from '@firebase-config/database';
import { Activity, Loader2, ShieldCheck, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';

import { AdminAnalyticsCard } from './admin/AdminAnalyticsCard';
import { AdminUserRow } from './admin/AdminUserRow';

export const AdminPage = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<IUserWithLimits[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUser, setSavingUser] = useState<string | null>(null);
  const [togglingTrainer, setTogglingTrainer] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const unsubscribe = subscribeToUserDirectory(
      async (directory: Record<string, IUserDirectoryEntry> | null) => {
        if (!directory) {
          setUsers([]);
          setLoading(false);

          return;
        }

        const entries = await Promise.all(
          Object.entries(directory).map(async ([uid, entry]) => {
            const isDeleted = !entry.email && !entry.lastLogin;
            try {
              const [
                limitModeResult,
                statsResult,
                isTrainerResult,
                avatarUrlResult,
              ] = await Promise.allSettled([
                getUserLimitModeForAdmin(uid),
                getUserUsageStats(uid),
                getTrainerFlagFromDirectory(uid),
                getUserAvatarUrl(uid),
              ]);

              const limitMode: MessageLimitMode =
                limitModeResult.status === 'fulfilled'
                  ? limitModeResult.value
                  : 'limited';
              const stats =
                statsResult.status === 'fulfilled' ? statsResult.value : null;
              const isTrainer =
                isTrainerResult.status === 'fulfilled'
                  ? isTrainerResult.value
                  : false;
              const avatarUrl =
                avatarUrlResult.status === 'fulfilled'
                  ? avatarUrlResult.value
                  : null;

              return {
                uid,
                email: entry.email || null,
                displayName: entry.displayName || null,
                avatarUrl,
                lastLogin: entry.lastLogin || null,
                deleted: isDeleted,
                limitMode,
                isTrainer,
                stats: stats
                  ? {
                      todayMessages: stats.todayMessages,
                      totalMessages: stats.totalMessages,
                      averageDaily: Math.round(stats.averageDaily * 10) / 10,
                      allTimeTotal: stats.allTimeTotal,
                    }
                  : null,
              };
            } catch {
              return {
                uid,
                email: entry.email || null,
                displayName: entry.displayName || null,
                avatarUrl: null,
                lastLogin: entry.lastLogin || null,
                deleted: isDeleted,
                limitMode: 'limited' as const,
                isTrainer: false,
                stats: null,
              };
            }
          }),
        );

        entries.sort((a, b) => {
          if (!a.lastLogin && !b.lastLogin) {
            return 0;
          }
          if (!a.lastLogin) {
            return 1;
          }
          if (!b.lastLogin) {
            return -1;
          }

          return (
            new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime()
          );
        });

        setUsers(entries);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [isAdmin]);

  const handleLimitModeChange = useCallback(
    async (uid: string, mode: MessageLimitMode) => {
      setSavingUser(uid);
      try {
        await setUserLimitModeForAdmin(uid, mode);
        setUsers((prev) =>
          prev.map((u) => (u.uid === uid ? { ...u, limitMode: mode } : u)),
        );
        toast.success(t('admin.limitSaved'));
      } catch {
        toast.error(t('common.saveError'));
      } finally {
        setSavingUser(null);
      }
    },
    [t],
  );

  const handleTrainerToggle = useCallback(
    async (uid: string, currentIsTrainer: boolean) => {
      setTogglingTrainer(uid);
      try {
        const token = await firebaseAuth.currentUser?.getIdToken();
        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch('/api/admin/set-trainer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            targetUid: uid,
            isTrainer: !currentIsTrainer,
          }),
        });

        if (!response.ok) {
          throw new Error('API error');
        }

        await setTrainerFlagInDirectory(uid, !currentIsTrainer);

        setUsers((prev) =>
          prev.map((u) =>
            u.uid === uid ? { ...u, isTrainer: !currentIsTrainer } : u,
          ),
        );
        toast.success(
          !currentIsTrainer
            ? t('admin.users.trainerGranted')
            : t('admin.users.trainerRevoked'),
        );
      } catch {
        toast.error(t('admin.users.trainerToggleError'));
      } finally {
        setTogglingTrainer(null);
      }
    },
    [t],
  );

  if (!isAdmin) {
    return <Navigate replace to={'/'} />;
  }

  return (
    <div
      className={
        'mx-auto w-full max-w-6xl flex flex-1 flex-col gap-4 p-4 lg:gap-8 lg:p-6'
      }
    >
      <div className={'space-y-1'}>
        <div className={'flex items-center gap-2'}>
          <ShieldCheck className={'h-8 w-8 text-primary'} />

          <h1 className={'text-3xl font-bold tracking-tight'}>
            {t('admin.title')}
          </h1>
        </div>

        <p className={'text-muted-foreground'}>{t('admin.description')}</p>
      </div>

      {users.length > 0 && <AdminAnalyticsCard users={users} />}

      <Card>
        <CardHeader>
          <CardTitle className={'flex items-center gap-2'}>
            <Users className={'h-5 w-5'} />
            {t('admin.users.title')}
          </CardTitle>

          <CardDescription>
            {t('admin.users.description', { count: users.length })}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className={'flex items-center justify-center py-8'}>
              <Loader2
                className={'h-6 w-6 animate-spin text-muted-foreground'}
              />
            </div>
          ) : users.length === 0 ? (
            <p className={'text-sm text-muted-foreground py-4'}>
              {t('admin.users.empty')}
            </p>
          ) : (
            <div className={'overflow-x-auto'}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={'w-[50px]'} />

                    <TableHead>{t('admin.users.email')}</TableHead>

                    <TableHead>{t('admin.users.name')}</TableHead>

                    <TableHead>{t('admin.users.lastLogin')}</TableHead>

                    <TableHead>
                      <div className={'flex items-center gap-1'}>
                        <Activity className={'h-3.5 w-3.5'} />
                        <span>{t('admin.analytics.allTimeTotal')}</span>
                      </div>
                    </TableHead>

                    <TableHead>
                      <div className={'flex items-center gap-1'}>
                        <Activity className={'h-3.5 w-3.5'} />
                        <span>{t('admin.analytics.last30d')}</span>
                      </div>
                    </TableHead>

                    <TableHead>
                      <div className={'flex items-center gap-1'}>
                        <Activity className={'h-3.5 w-3.5'} />
                        <span>{t('admin.analytics.today')}</span>
                      </div>
                    </TableHead>

                    <TableHead>{t('admin.analytics.limitMode')}</TableHead>

                    <TableHead>{t('admin.users.trainer')}</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {users.map((user) => (
                    <AdminUserRow
                      isSaving={savingUser === user.uid}
                      isTogglingTrainer={togglingTrainer === user.uid}
                      key={user.uid}
                      onLimitModeChange={handleLimitModeChange}
                      onTrainerToggle={handleTrainerToggle}
                      user={user}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

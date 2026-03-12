import type { UserDirectoryEntry } from '../firebase/database';

import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Switch } from '@components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import {
  Activity,
  Loader2,
  Save,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuth } from '../contexts/useAuth';
import { auth as firebaseAuth } from '../firebase/auth';
import {
  getTrainerFlagFromDirectory,
  getUserAvatarUrl,
  getUserMaxLimitForAdmin,
  getUserUsageStats,
  setTrainerFlagInDirectory,
  setUserMaxLimitForAdmin,
  subscribeToUserDirectory,
} from '../firebase/database';

interface UserWithLimits {
  uid: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  lastLogin: string | null;
  maxLimit: number;
  deleted?: boolean;
  isTrainer?: boolean;
  stats?: {
    todayMessages: number;
    totalMessages: number;
    averageDaily: number;
    allTimeTotal: number;
  } | null;
}

export const AdminPage = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserWithLimits[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLimits, setEditingLimits] = useState<Record<string, string>>(
    {},
  );
  const [savingUser, setSavingUser] = useState<string | null>(null);
  const [togglingTrainer, setTogglingTrainer] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const unsubscribe = subscribeToUserDirectory(
      async (directory: Record<string, UserDirectoryEntry> | null) => {
        if (!directory) {
          setUsers([]);
          setLoading(false);

          return;
        }

        const entries = await Promise.all(
          Object.entries(directory).map(async ([uid, entry]) => {
            const isDeleted = !entry.email && !entry.lastLogin;
            const [maxLimit, stats, isTrainer, avatarUrl] = await Promise.all([
              getUserMaxLimitForAdmin(uid),
              getUserUsageStats(uid),
              getTrainerFlagFromDirectory(uid),
              getUserAvatarUrl(uid),
            ]);

            return {
              uid,
              email: entry.email || null,
              displayName: entry.displayName || null,
              avatarUrl,
              lastLogin: entry.lastLogin || null,
              deleted: isDeleted,
              maxLimit,
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
          }),
        );

        entries.sort((a, b) => {
          // Deleted users (no lastLogin) go to the bottom
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

  const handleLimitSave = useCallback(
    async (uid: string) => {
      const maxStr = editingLimits[uid];
      if (maxStr === undefined) {
        return;
      }

      const max = parseInt(maxStr, 10);
      if (isNaN(max) || max < -1) {
        toast.error(t('admin.invalidLimit'));

        return;
      }

      setSavingUser(uid);
      try {
        await setUserMaxLimitForAdmin(uid, max);
        setUsers((prev) =>
          prev.map((u) => (u.uid === uid ? { ...u, maxLimit: max } : u)),
        );
        setEditingLimits((prev) => {
          const next = { ...prev };
          delete next[uid];

          return next;
        });
        toast.success(t('admin.limitSaved'));
      } catch {
        toast.error(t('common.saveError'));
      } finally {
        setSavingUser(null);
      }
    },
    [editingLimits, t],
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

        // Update the directory flag for display
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

      {users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className={'flex items-center gap-2'}>
              <TrendingUp className={'h-5 w-5'} />
              {t('admin.analytics.title')}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className={'grid gap-4 sm:grid-cols-2 lg:grid-cols-5'}>
              <div className={'space-y-1'}>
                <p className={'text-sm text-muted-foreground'}>
                  {t('admin.analytics.allTimeTotal')}
                </p>

                <p className={'text-2xl font-bold'}>
                  {users.reduce(
                    (sum, u) => sum + (u.stats?.allTimeTotal ?? 0),
                    0,
                  )}
                </p>
              </div>

              <div className={'space-y-1'}>
                <p className={'text-sm text-muted-foreground'}>
                  {t('admin.analytics.last30Days')}
                </p>

                <p className={'text-2xl font-bold'}>
                  {users.reduce(
                    (sum, u) => sum + (u.stats?.totalMessages ?? 0),
                    0,
                  )}
                </p>
              </div>

              <div className={'space-y-1'}>
                <p className={'text-sm text-muted-foreground'}>
                  {t('admin.analytics.active30d')}
                </p>

                <p className={'text-2xl font-bold'}>
                  {
                    users.filter((u) => (u.stats?.totalMessages ?? 0) > 0)
                      .length
                  }
                  <span className={'text-sm font-normal text-muted-foreground'}>
                    {` / ${users.filter((u) => !u.deleted).length}`}
                  </span>
                </p>
              </div>

              <div className={'space-y-1'}>
                <p className={'text-sm text-muted-foreground'}>
                  {t('admin.analytics.avgPerUser')}
                </p>

                <p className={'text-2xl font-bold'}>
                  {users.length > 0
                    ? Math.round(
                        users.reduce(
                          (sum, u) => sum + (u.stats?.totalMessages ?? 0),
                          0,
                        ) / users.length,
                      )
                    : 0}
                </p>
              </div>

              <div className={'space-y-1'}>
                <p className={'text-sm text-muted-foreground'}>
                  {t('admin.analytics.avgDailyUser')}
                </p>

                <p className={'text-2xl font-bold'}>
                  {users.length > 0
                    ? (
                        users.reduce(
                          (sum, u) => sum + (u.stats?.averageDaily ?? 0),
                          0,
                        ) / users.length
                      ).toFixed(1)
                    : '0.0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

                    <TableHead>{t('admin.analytics.maxLimit')}</TableHead>

                    <TableHead className={'w-[100px]'} />

                    <TableHead>{t('admin.users.trainer')}</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {users.map((user) => {
                    const isEditing = editingLimits[user.uid] !== undefined;
                    const currentMax =
                      editingLimits[user.uid] ?? String(user.maxLimit);

                    return (
                      <TableRow key={user.uid}>
                        <TableCell>
                          <Avatar className={'h-8 w-8 rounded-lg'}>
                            <AvatarImage
                              alt={user.displayName ?? ''}
                              src={user.avatarUrl ?? undefined}
                            />
                            <AvatarFallback className={'rounded-lg text-xs'}>
                              {(user.displayName ?? user.email ?? '?')
                                .charAt(0)
                                .toUpperCase()}
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
                            <span className={'text-muted-foreground'}>
                              {'-'}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className={'text-sm'}>
                          {user.lastLogin ? (
                            new Date(user.lastLogin).toLocaleDateString()
                          ) : (
                            <span className={'text-muted-foreground'}>
                              {'-'}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className={'text-sm font-medium'}>
                          {user.stats?.allTimeTotal ?? (
                            <span className={'text-muted-foreground'}>
                              {'-'}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className={'text-sm font-medium'}>
                          {user.stats?.totalMessages ?? (
                            <span className={'text-muted-foreground'}>
                              {'-'}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className={'text-sm font-medium'}>
                          {user.stats?.todayMessages ?? (
                            <span className={'text-muted-foreground'}>
                              {'-'}
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <Label
                            className={'sr-only'}
                            htmlFor={`limit-${user.uid}`}
                          >
                            {t('admin.analytics.maxLimit')}
                          </Label>

                          <Input
                            className={'w-20 h-8'}
                            id={`limit-${user.uid}`}
                            min={-1}
                            type={'number'}
                            value={currentMax}
                            onChange={(e) =>
                              setEditingLimits((prev) => ({
                                ...prev,
                                [user.uid]: e.target.value,
                              }))
                            }
                          />
                        </TableCell>

                        <TableCell>
                          <Button
                            className={'h-8'}
                            disabled={!isEditing || savingUser === user.uid}
                            onClick={() => handleLimitSave(user.uid)}
                            size={'sm'}
                            variant={'outline'}
                          >
                            {savingUser === user.uid ? (
                              <Loader2 className={'h-3.5 w-3.5 animate-spin'} />
                            ) : (
                              <Save className={'h-3.5 w-3.5'} />
                            )}
                          </Button>
                        </TableCell>

                        <TableCell>
                          {togglingTrainer === user.uid ? (
                            <Loader2 className={'h-4 w-4 animate-spin'} />
                          ) : (
                            <Switch
                              checked={user.isTrainer ?? false}
                              disabled={user.deleted}
                              onCheckedChange={() =>
                                handleTrainerToggle(
                                  user.uid,
                                  user.isTrainer ?? false,
                                )
                              }
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

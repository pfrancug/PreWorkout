import type {
  DailyMessageLimit,
  UserDirectoryEntry,
} from '../firebase/database';

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
import {
  getUserLimitsForAdmin,
  getUserUsageStats,
  setUserLimitsForAdmin,
  subscribeToUserDirectory,
} from '../firebase/database';

interface UserWithLimits {
  uid: string;
  email: string;
  displayName: string;
  lastLogin: string;
  limits: DailyMessageLimit | null;
  stats?: {
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
            const [limits, stats] = await Promise.all([
              getUserLimitsForAdmin(uid),
              getUserUsageStats(uid),
            ]);

            return {
              uid,
              email: entry.email,
              displayName: entry.displayName,
              lastLogin: entry.lastLogin,
              limits,
              stats: stats
                ? {
                    totalMessages: stats.totalMessages,
                    averageDaily: Math.round(stats.averageDaily * 10) / 10,
                    allTimeTotal: stats.allTimeTotal,
                  }
                : null,
            };
          }),
        );

        entries.sort(
          (a, b) =>
            new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime(),
        );

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
        const today = new Date().toISOString().split('T')[0];
        const user = users.find((u) => u.uid === uid);
        const currentCount = user?.limits?.count ?? 0;
        const currentDate = user?.limits?.date ?? today;
        // Keep existing date if it's today, otherwise use today (handles new day)
        const date = currentDate === today ? currentDate : today;
        await setUserLimitsForAdmin(uid, {
          date,
          count: currentDate === today ? currentCount : 0,
          max,
        });
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === uid
              ? {
                  ...u,
                  limits: {
                    date,
                    count: currentDate === today ? currentCount : 0,
                    max,
                  },
                }
              : u,
          ),
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
    [editingLimits, t, users],
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
              {'Usage Analytics (Last 30 Days)\r'}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className={'grid gap-4 sm:grid-cols-2 lg:grid-cols-5'}>
              <div className={'space-y-1'}>
                <p className={'text-sm text-muted-foreground'}>
                  {'All Time Total\r'}
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
                  {'Last 30 Days\r'}
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
                  {'Active Users\r'}
                </p>

                <p className={'text-2xl font-bold'}>
                  {
                    users.filter((u) => (u.stats?.totalMessages ?? 0) > 0)
                      .length
                  }
                </p>
              </div>

              <div className={'space-y-1'}>
                <p className={'text-sm text-muted-foreground'}>
                  {'Avg Per User\r'}
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
                  {'Avg Daily/User\r'}
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
                    <TableHead>{t('admin.users.email')}</TableHead>

                    <TableHead>{t('admin.users.name')}</TableHead>

                    <TableHead>{t('admin.users.lastLogin')}</TableHead>

                    <TableHead>
                      <div className={'flex items-center gap-1'}>
                        <Activity className={'h-3.5 w-3.5'} />
                        <span>{'All Time'}</span>
                      </div>
                    </TableHead>

                    <TableHead>
                      <div className={'flex items-center gap-1'}>
                        <Activity className={'h-3.5 w-3.5'} />
                        <span>{'30d Total'}</span>
                      </div>
                    </TableHead>

                    <TableHead>{'Today'}</TableHead>

                    <TableHead>{'Max Limit'}</TableHead>

                    <TableHead className={'w-[100px]'} />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {users.map((user) => {
                    const isEditing = editingLimits[user.uid] !== undefined;
                    const currentMax =
                      editingLimits[user.uid] ?? String(user.limits?.max ?? 5);

                    return (
                      <TableRow key={user.uid}>
                        <TableCell className={'font-mono text-sm'}>
                          {user.email}
                        </TableCell>

                        <TableCell>
                          {user.displayName ?? (
                            <span className={'text-muted-foreground'}>
                              {'-'}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className={'text-sm'}>
                          {new Date(user.lastLogin).toLocaleDateString()}
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
                          {user.limits?.count ?? (
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
                            {'Max Limit\r'}
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

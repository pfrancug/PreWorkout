import type { IUserWithLimits } from './types';

import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AdminAnalyticsCardProps {
  users: IUserWithLimits[];
}

export const AdminAnalyticsCard = ({ users }: AdminAnalyticsCardProps) => {
  const { t } = useTranslation();

  return (
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
              {users.reduce((sum, u) => sum + (u.stats?.allTimeTotal ?? 0), 0)}
            </p>
          </div>

          <div className={'space-y-1'}>
            <p className={'text-sm text-muted-foreground'}>
              {t('admin.analytics.last30Days')}
            </p>

            <p className={'text-2xl font-bold'}>
              {users.reduce((sum, u) => sum + (u.stats?.totalMessages ?? 0), 0)}
            </p>
          </div>

          <div className={'space-y-1'}>
            <p className={'text-sm text-muted-foreground'}>
              {t('admin.analytics.active30d')}
            </p>

            <p className={'text-2xl font-bold'}>
              {users.filter((u) => (u.stats?.totalMessages ?? 0) > 0).length}
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
  );
};

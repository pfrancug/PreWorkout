import type { Tab } from './types';
import type { ISharingPreferences } from '@firebase-config/database';

import { ReadOnlyDataTable } from '@components/dataTable/ReadOnlyDataTable';
import { FullCalendarView } from '@components/FullCalendarView';
import { TrainingSessions } from '@components/TrainingSessions';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import { useAuth } from '@contexts/useAuth';
import { getReadOnlyColumns } from '@data/readOnlyColumns';
import {
  getUserAvatarUrl,
  getUserDisplayName,
  subscribeToSharingPreferences,
  subscribeToTrainerConnections,
} from '@firebase-config/database';
import { useTraineeDataSet } from '@hooks/useTraineeDataSet';
import { ArrowLeft, BookOpen, CalendarDays, Dumbbell } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

export const TraineeViewPage = () => {
  const { t } = useTranslation();
  const { traineeId } = useParams<{ traineeId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const [traineeName, setTraineeName] = useState<string | null>(null);
  const [traineeAvatar, setTraineeAvatar] = useState<string | null>(null);
  const [infoLoading, setInfoLoading] = useState(true);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [sharingPrefs, setSharingPrefs] = useState<ISharingPreferences | null>(
    null,
  );

  const showDiary = sharingPrefs?.shareDiary === true;
  const showActivities = sharingPrefs?.shareCalendarActivities === true;

  // Fall back to calendar when diary is not shared
  const effectiveTab =
    activeTab === 'diary' && !showDiary ? 'calendar' : activeTab;

  const { dataSet, isLoading: diaryLoading } = useTraineeDataSet(
    effectiveTab === 'diary' && showDiary ? traineeId : undefined,
  );

  const columns = useMemo(() => getReadOnlyColumns(t), [t]);

  useEffect(() => {
    if (!traineeId) {
      return;
    }

    let cancelled = false;

    Promise.all([getUserDisplayName(traineeId), getUserAvatarUrl(traineeId)])
      .then(([name, avatar]) => {
        if (cancelled) {
          return;
        }

        setTraineeName(name);
        setTraineeAvatar(avatar);
      })
      .catch(() => {
        // Silently ignore — name/avatar are non-critical
      })
      .finally(() => {
        if (!cancelled) {
          setInfoLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [traineeId]);

  // Look up the active connection with this trainee
  useEffect(() => {
    if (!user || !traineeId) {
      return;
    }

    const unsub = subscribeToTrainerConnections(user.uid, (connections) => {
      const active = connections.find(
        (c) => c.traineeId === traineeId && c.status === 'active',
      );
      setConnectionId(active?.id ?? null);
    });

    return unsub;
  }, [user, traineeId]);

  // Subscribe to trainee's sharing preferences
  useEffect(() => {
    if (!traineeId) {
      return;
    }

    return subscribeToSharingPreferences(traineeId, setSharingPrefs);
  }, [traineeId]);

  if (!user || !traineeId) {
    return null;
  }

  const displayName = traineeName || t('settings.trainer.unknownUser');
  const initials = (displayName || '?').charAt(0).toUpperCase();

  const tabs: { id: Tab; labelKey: string; icon: typeof CalendarDays }[] = [
    {
      id: 'calendar',
      labelKey: 'settings.trainer.tabCalendar',
      icon: CalendarDays,
    },
    ...(showDiary
      ? [
          {
            id: 'diary' as Tab,
            labelKey: 'settings.trainer.tabDiary',
            icon: BookOpen,
          },
        ]
      : []),
    {
      id: 'sessions',
      labelKey: 'settings.trainer.tabSessions',
      icon: Dumbbell,
    },
  ];

  return (
    <div
      className={
        'mx-auto w-full max-w-3xl flex flex-1 flex-col gap-4 p-4 lg:gap-8 lg:p-6'
      }
    >
      {/* Header */}
      <div className={'flex items-center gap-3'}>
        <Button
          onClick={() => navigate('/trainer/connected')}
          size={'icon'}
          variant={'ghost'}
        >
          <ArrowLeft className={'h-4 w-4'} />
        </Button>

        {infoLoading ? (
          <div className={'flex items-center gap-3'}>
            <Skeleton className={'h-10 w-10 rounded-lg'} />
            <Skeleton className={'h-6 w-40'} />
          </div>
        ) : (
          <div className={'flex items-center gap-3'}>
            <Avatar className={'h-10 w-10 rounded-lg'}>
              <AvatarImage alt={displayName} src={traineeAvatar || undefined} />
              <AvatarFallback className={'rounded-lg'}>
                {initials}
              </AvatarFallback>
            </Avatar>

            <div>
              <h1 className={'text-xl font-bold tracking-tight'}>
                {displayName}
              </h1>
              <Badge className={'text-xs'} variant={'secondary'}>
                {t('settings.trainer.traineeLabel')}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className={'flex gap-1 rounded-lg border border-border p-1'}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type={'button'}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              effectiveTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <tab.icon className={'h-4 w-4'} />
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {effectiveTab === 'calendar' && (
        <FullCalendarView
          allowTrainerToggle
          readOnly
          connectionId={connectionId ?? undefined}
          filterActivities={!showActivities}
          userId={traineeId}
        />
      )}

      {effectiveTab === 'diary' && (
        <div className={'w-full'}>
          {diaryLoading ? (
            <div className={'space-y-3'}>
              <Skeleton className={'h-12 w-full'} />
              <Skeleton className={'h-12 w-full'} />
              <Skeleton className={'h-12 w-full'} />
            </div>
          ) : (
            <ReadOnlyDataTable columns={columns} data={dataSet} />
          )}
        </div>
      )}

      {effectiveTab === 'sessions' && connectionId && (
        <TrainingSessions connectionId={connectionId} role={'trainer'} />
      )}
    </div>
  );
};

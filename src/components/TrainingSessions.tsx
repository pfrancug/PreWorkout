import type { TrainingSessionsProps } from './types';
import type { ITrainingSession } from '@app-types/types';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import { Checkbox } from '@components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import {
  batchRemoveFromPackage,
  cancelSession,
  completeSession,
  deleteTrainingSession,
  groupSessionsAsPackage,
  markPackagePaid,
  markPackageUnpaid,
  markSessionPaid,
  markSessionUnpaid,
  reactivateSession,
  subscribeToTrainingSessions,
  toggleTrainerCalendarDay,
} from '@firebase-config/database';
import { cn } from '@lib/utils';
import {
  Ban,
  Calendar,
  CheckCheck,
  Clock,
  CreditCard,
  Ellipsis,
  Package,
  Trash2,
  Undo2,
  Unlink,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export const TrainingSessions = ({
  connectionId,
  role,
}: TrainingSessionsProps) => {
  const { t, i18n } = useTranslation();
  const [sessions, setSessions] = useState<ITrainingSession[]>([]);
  const [filterMonth, setFilterMonth] = useState<string>('all');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCancelled, setShowCancelled] = useState(false);
  const [groupingMode, setGroupingMode] = useState(false);

  useEffect(() => {
    const unsub = subscribeToTrainingSessions(connectionId, setSessions);

    return unsub;
  }, [connectionId]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    for (const s of sessions) {
      months.add(s.date.slice(0, 7));
    }

    return [...months].sort().reverse();
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    let result = sessions;
    if (filterMonth !== 'all') {
      result = result.filter((s) => s.date.startsWith(filterMonth));
    }
    if (!showCancelled) {
      result = result.filter((s) => s.status !== 'cancelled');
    }

    return [...result].sort((a, b) => a.date.localeCompare(b.date));
  }, [sessions, filterMonth, showCancelled]);

  const stats = useMemo(() => {
    const completed = filteredSessions.filter(
      (s) => s.status === 'completed',
    ).length;
    const planned = filteredSessions.filter(
      (s) => s.status === 'planned',
    ).length;
    const cancelled = filteredSessions.filter(
      (s) => s.status === 'cancelled',
    ).length;
    const paid = filteredSessions.filter(
      (s) => s.paymentStatus === 'paid',
    ).length;
    const unpaid = filteredSessions.filter(
      (s) => s.status !== 'cancelled' && s.paymentStatus !== 'paid',
    ).length;

    return { completed, planned, cancelled, paid, unpaid };
  }, [filteredSessions]);

  const packageInfo = useMemo(() => {
    const map = new Map<
      string,
      { index: number; total: number; packageId: string; allPaid: boolean }
    >();
    const groups = new Map<string, ITrainingSession[]>();
    for (const s of sessions) {
      if (s.packageId) {
        const arr = groups.get(s.packageId) ?? [];
        arr.push(s);
        groups.set(s.packageId, arr);
      }
    }
    for (const [pkgId, group] of groups) {
      group.sort((a, b) => a.date.localeCompare(b.date));
      const allPaid = group.every((s) => s.paymentStatus === 'paid');
      for (let i = 0; i < group.length; i++) {
        map.set(group[i].id, {
          index: i + 1,
          total: group.length,
          packageId: pkgId,
          allPaid,
        });
      }
    }

    return map;
  }, [sessions]);

  // Organize sessions into display groups: packaged sessions grouped together, standalone sessions as-is
  type DisplayItem =
    | { type: 'single'; session: ITrainingSession }
    | { type: 'package'; packageId: string; sessions: ITrainingSession[] };

  const displayItems = useMemo(() => {
    const items: DisplayItem[] = [];
    const packageGroups = new Map<string, ITrainingSession[]>();
    const packageInsertIndex = new Map<string, number>();

    for (const s of filteredSessions) {
      if (s.packageId) {
        let group = packageGroups.get(s.packageId);
        if (!group) {
          group = [];
          packageGroups.set(s.packageId, group);
          packageInsertIndex.set(s.packageId, items.length);
          items.push({
            type: 'package',
            packageId: s.packageId,
            sessions: group,
          });
        }
        group.push(s);
      } else {
        items.push({ type: 'single', session: s });
      }
    }

    return items;
  }, [filteredSessions]);

  const handleComplete = async (sessionId: string) => {
    try {
      await completeSession(connectionId, sessionId);
      toast.success(t('sessions.completeSuccess'));
    } catch {
      toast.error(t('common.saveError'));
    }
  };

  const handleCancel = async (session: ITrainingSession) => {
    try {
      await cancelSession(connectionId, session.id, role);
    } catch {
      toast.error(t('common.saveError'));

      return;
    }

    toast.success(t('sessions.cancelSuccess'));
    // Best-effort: remove calendar marker so it disappears from trainee's calendar
    try {
      await toggleTrainerCalendarDay(session.traineeId, session.date, false);
    } catch {
      // Cancellation already succeeded; don't confuse the user
    }
  };

  const handleDelete = async (session: ITrainingSession) => {
    try {
      await deleteTrainingSession(connectionId, session.id);
      toast.success(t('sessions.deleteSuccess'));
    } catch {
      toast.error(t('common.saveError'));
    }
  };

  const handleReactivate = async (session: ITrainingSession) => {
    try {
      await reactivateSession(connectionId, session.id);
      await toggleTrainerCalendarDay(session.traineeId, session.date, true);
      toast.success(t('sessions.reactivateSuccess'));
    } catch {
      toast.error(t('common.saveError'));
    }
  };

  const handleTogglePaid = async (
    sessionId: string,
    currentlyPaid: boolean,
  ) => {
    try {
      if (currentlyPaid) {
        await markSessionUnpaid(connectionId, sessionId);
      } else {
        await markSessionPaid(connectionId, sessionId);
      }
      toast.success(t('sessions.paymentUpdated'));
    } catch {
      toast.error(t('common.saveError'));
    }
  };

  const handleGroupAsPackage = async () => {
    if (selectedIds.size < 2) {
      return;
    }
    try {
      await groupSessionsAsPackage(connectionId, [...selectedIds]);
      setSelectedIds(new Set());
      toast.success(t('sessions.packageCreated'));
    } catch {
      toast.error(t('common.saveError'));
    }
  };

  const handleUngroupPackage = async (packageSessions: ITrainingSession[]) => {
    try {
      await batchRemoveFromPackage(
        connectionId,
        packageSessions.map((s) => s.id),
      );
      toast.success(t('sessions.removedFromPackage'));
    } catch {
      toast.error(t('common.saveError'));
    }
  };

  const handleTogglePackagePaid = async (
    packageId: string,
    currentlyAllPaid: boolean,
  ) => {
    try {
      if (currentlyAllPaid) {
        await markPackageUnpaid(connectionId, packageId, sessions);
      } else {
        await markPackagePaid(connectionId, packageId, sessions);
      }
      toast.success(t('sessions.paymentUpdated'));
    } catch {
      toast.error(t('common.saveError'));
    }
  };

  const toggleSelected = (sessionId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }

      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    return date.toLocaleDateString(i18n.language, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const getStatusBadge = (session: ITrainingSession) => {
    if (session.status === 'cancelled') {
      return (
        <Badge className={'bg-muted text-muted-foreground'} variant={'outline'}>
          <Ban className={'h-3 w-3'} />
        </Badge>
      );
    }
    if (session.status === 'completed') {
      return (
        <Badge className={'bg-green-500/10 text-green-600'} variant={'outline'}>
          <CheckCheck className={'h-3 w-3'} />
        </Badge>
      );
    }

    return (
      <Badge className={'bg-blue-500/10 text-blue-600'} variant={'outline'}>
        <Clock className={'h-3 w-3'} />
      </Badge>
    );
  };

  const getPaymentBadge = (session: ITrainingSession) => {
    if (session.status === 'cancelled') {
      return null;
    }
    if (session.paymentStatus === 'paid') {
      return (
        <Badge className={'bg-green-500/10 text-green-600'} variant={'outline'}>
          <CreditCard className={'h-3 w-3'} />
        </Badge>
      );
    }

    return (
      <Badge className={'bg-red-500/10 text-red-600'} variant={'outline'}>
        <CreditCard className={'h-3 w-3'} />
      </Badge>
    );
  };

  const renderSessionContent = (session: ITrainingSession) => (
    <>
      {/* Checkbox for package selection */}
      {groupingMode &&
        role === 'trainer' &&
        !session.packageId &&
        session.status !== 'cancelled' && (
          <Checkbox
            checked={selectedIds.has(session.id)}
            onCheckedChange={() => toggleSelected(session.id)}
          />
        )}

      {/* Date & Time */}
      <div className={'flex min-w-[140px] items-center gap-2'}>
        <Calendar className={'h-4 w-4 text-muted-foreground'} />
        <span className={'text-sm font-medium'}>
          {formatDate(session.date)}
        </span>
      </div>

      {/* Time */}
      <div className={'flex min-w-[80px] items-center gap-1.5'}>
        <Clock className={'h-3.5 w-3.5 text-muted-foreground'} />
        <span className={'text-xs text-muted-foreground'}>
          {session.time ?? t('sessions.noTime')}
        </span>
      </div>

      {/* Badges */}
      <div className={'flex flex-1 flex-wrap items-center gap-1.5'}>
        {packageInfo.has(session.id) && (
          <Badge className={'bg-primary/10 text-primary'} variant={'outline'}>
            <Package className={'mr-1 h-3 w-3'} />
            {packageInfo.get(session.id)!.index}
            {'/'}
            {packageInfo.get(session.id)!.total}
          </Badge>
        )}
        {getStatusBadge(session)}
        {getPaymentBadge(session)}
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className={'h-8 w-8'} size={'icon'} variant={'ghost'}>
            <Ellipsis className={'h-4 w-4'} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={'end'}>
          {role === 'trainer' && session.status === 'planned' && (
            <DropdownMenuItem onClick={() => handleComplete(session.id)}>
              <CheckCheck className={'mr-2 h-4 w-4'} />
              {t('sessions.markCompleted')}
            </DropdownMenuItem>
          )}

          {role === 'trainer' && session.status === 'completed' && (
            <DropdownMenuItem onClick={() => handleReactivate(session)}>
              <Undo2 className={'mr-2 h-4 w-4'} />
              {t('sessions.undoComplete')}
            </DropdownMenuItem>
          )}

          {role === 'trainer' && session.status !== 'cancelled' && (
            <DropdownMenuItem
              onClick={() =>
                handleTogglePaid(session.id, session.paymentStatus === 'paid')
              }
            >
              <CreditCard className={'mr-2 h-4 w-4'} />
              {session.paymentStatus === 'paid'
                ? t('sessions.markUnpaid')
                : t('sessions.markPaid')}
            </DropdownMenuItem>
          )}

          {session.status === 'planned' && (
            <DropdownMenuItem
              className={'text-destructive'}
              onClick={() => handleCancel(session)}
            >
              <Ban className={'mr-2 h-4 w-4'} />
              {t('sessions.cancel')}
            </DropdownMenuItem>
          )}

          {role === 'trainer' && session.status === 'cancelled' && (
            <>
              <DropdownMenuItem onClick={() => handleReactivate(session)}>
                <Undo2 className={'mr-2 h-4 w-4'} />
                {t('sessions.reactivate')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className={'text-destructive'}
                onClick={() => handleDelete(session)}
              >
                <Trash2 className={'mr-2 h-4 w-4'} />
                {t('sessions.delete')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{t('sessions.title')}</CardTitle>
          <CardDescription>{t('sessions.description')}</CardDescription>
        </div>

        <div className={'flex w-full items-center gap-2 pt-1'}>
          <div className={'flex flex-wrap items-center gap-2'}>
            <button
              onClick={() => setShowCancelled((v) => !v)}
              type={'button'}
              className={cn(
                'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                showCancelled
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-accent',
              )}
            >
              <Ban className={'h-3 w-3'} />
              {t('sessions.showCancelled')}
            </button>
            {role === 'trainer' && (
              <button
                type={'button'}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  groupingMode
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-accent',
                )}
                onClick={() => {
                  setGroupingMode((v) => {
                    if (v) {
                      setSelectedIds(new Set());
                    }

                    return !v;
                  });
                }}
              >
                <Package className={'h-3 w-3'} />
                {t('sessions.groupingMode')}
              </button>
            )}
            {availableMonths.length > 1 && (
              <Select onValueChange={setFilterMonth} value={filterMonth}>
                <SelectTrigger className={'w-[160px]'}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={'all'}>
                    {t('sessions.allMonths')}
                  </SelectItem>
                  {availableMonths.map((m) => {
                    const [y, mo] = m.split('-').map(Number);
                    const label = new Date(y, mo - 1).toLocaleDateString(
                      i18n.language,
                      { month: 'long', year: 'numeric' },
                    );

                    return (
                      <SelectItem key={m} value={m}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>
          {role === 'trainer' && groupingMode && (
            <button
              disabled={selectedIds.size < 2}
              onClick={handleGroupAsPackage}
              type={'button'}
              className={cn(
                'ml-auto inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                selectedIds.size >= 2
                  ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'cursor-not-allowed border-border bg-card text-muted-foreground opacity-50',
              )}
            >
              <Package className={'h-3 w-3'} />
              {t('sessions.groupAsPackage', { count: selectedIds.size })}
            </button>
          )}
        </div>

        {/* Stats summary */}
        <div className={'flex flex-wrap gap-3 pt-2'}>
          <div
            className={
              'flex items-center gap-1.5 text-sm text-muted-foreground'
            }
          >
            <CheckCheck className={'h-4 w-4 text-green-600'} />
            <span>
              {stats.completed} {t('sessions.completed')}
            </span>
          </div>
          <div
            className={
              'flex items-center gap-1.5 text-sm text-muted-foreground'
            }
          >
            <Calendar className={'h-4 w-4 text-blue-600'} />
            <span>
              {stats.planned} {t('sessions.planned')}
            </span>
          </div>
          <div
            className={
              'flex items-center gap-1.5 text-sm text-muted-foreground'
            }
          >
            <CreditCard className={'h-4 w-4 text-green-600'} />
            <span>
              {stats.paid} {t('sessions.paidCount')}
            </span>
          </div>
          {stats.unpaid > 0 && (
            <div
              className={
                'flex items-center gap-1.5 text-sm text-muted-foreground'
              }
            >
              <CreditCard className={'h-4 w-4 text-red-600'} />
              <span>
                {stats.unpaid} {t('sessions.unpaidCount')}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {filteredSessions.length === 0 ? (
          <p className={'py-8 text-center text-sm text-muted-foreground'}>
            {t('sessions.empty')}
          </p>
        ) : (
          <div className={'space-y-2'}>
            {displayItems.map((item) =>
              item.type === 'package' ? (
                <div
                  key={`pkg-${item.packageId}`}
                  className={
                    'rounded-lg border-2 border-primary/20 bg-primary/5 p-2 space-y-1.5'
                  }
                >
                  {role === 'trainer' && (
                    <div className={'flex items-center justify-end gap-1 px-1'}>
                      <Button
                        className={'h-7 gap-1 text-xs'}
                        size={'sm'}
                        variant={'outline'}
                        onClick={() => {
                          const allPaid = item.sessions.every(
                            (s) => s.paymentStatus === 'paid',
                          );
                          handleTogglePackagePaid(item.packageId, allPaid);
                        }}
                      >
                        <CreditCard className={'h-3.5 w-3.5'} />
                        {item.sessions.every((s) => s.paymentStatus === 'paid')
                          ? t('sessions.markPackageUnpaid')
                          : t('sessions.markPackagePaid')}
                      </Button>
                      <Button
                        className={'h-7 gap-1 text-xs'}
                        onClick={() => handleUngroupPackage(item.sessions)}
                        size={'sm'}
                        variant={'ghost'}
                      >
                        <Unlink className={'h-3.5 w-3.5'} />
                        {t('sessions.ungroupPackage')}
                      </Button>
                    </div>
                  )}
                  {item.sessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        'flex flex-col gap-2 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:gap-3',
                        session.status === 'cancelled' && 'opacity-50',
                      )}
                    >
                      {renderSessionContent(session)}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  key={item.session.id}
                  className={cn(
                    'flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-3',
                    item.session.status === 'cancelled' && 'opacity-50',
                  )}
                >
                  {renderSessionContent(item.session)}
                </div>
              ),
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

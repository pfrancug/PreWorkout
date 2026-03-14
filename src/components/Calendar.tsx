import type {
  ActivityCategory,
  CalendarActivity,
  CalendarData,
  CalendarEntries,
  CalendarNotes,
  TrainerCalendarData,
} from '../firebase/database';
import type { ITrainingSession } from '../types/types';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { cn } from '@lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Settings2,
  StickyNote,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
  ACTIVITY_COLOR_MAP,
  DEFAULT_CATEGORIES,
} from '../constants/activities';
import { useAuth } from '../contexts/useAuth';
import { useSettings } from '../contexts/useSettings';
import {
  createTrainingSession,
  saveCalendarDay,
  saveCalendarNote,
  subscribeToActivityCategories,
  subscribeToCalendarEntries,
  subscribeToCalendarNotes,
  subscribeToTraineeConnection,
  subscribeToTrainerCalendar,
  subscribeToTrainingSessions,
  toggleTrainerCalendarDay,
} from '../firebase/database';
import { useIsMobile } from '../hooks/useMobile';
import { ActivityIcon } from './ActivityIcon';

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const getFirstDayOfWeek = (year: number, month: number) => {
  const day = new Date(year, month, 1).getDay();

  // Convert Sunday=0 to Monday-first (Mon=0, Sun=6)
  return day === 0 ? 6 : day - 1;
};

const formatDateKey = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

interface CalendarProps {
  /** Override whose data to display (defaults to current user) */
  userId?: string;
  /** When true, disable all editing (activity toggles, notes) */
  readOnly?: boolean;
  /** Allow toggling trainer-linked activity even in readOnly mode (for trainer supervised view) */
  allowTrainerToggle?: boolean;
  /** The active trainer connection ID — needed for creating training sessions */
  connectionId?: string;
}

export const Calendar = ({
  allowTrainerToggle = false,
  connectionId: connectionIdProp,
  userId: propUserId,
  readOnly = false,
}: CalendarProps = {}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { preferences } = useSettings();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const targetUserId = propUserId || user?.uid;
  const isOwnCalendar = !propUserId || propUserId === user?.uid;

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [calendarEntries, setCalendarEntries] =
    useState<CalendarEntries | null>(null);
  const [calendarNotes, setCalendarNotes] = useState<CalendarNotes | null>(
    null,
  );
  const [trainerCalendar, setTrainerCalendar] =
    useState<TrainerCalendarData | null>(null);
  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<ITrainingSession[]>(
    [],
  );
  const [autoConnectionId, setAutoConnectionId] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [dropdownOpenDay, setDropdownOpenDay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>(
    preferences.defaultCalendarView,
  );

  const connectionId = connectionIdProp ?? autoConnectionId ?? undefined;

  // Auto-detect connectionId for the trainee's own calendar
  useEffect(() => {
    if (connectionIdProp || !isOwnCalendar || !user) {
      return;
    }

    const unsub = subscribeToTraineeConnection(user.uid, (conn) => {
      setAutoConnectionId(conn?.status === 'active' ? conn.id : null);
    });

    return unsub;
  }, [connectionIdProp, isOwnCalendar, user]);

  // Week view state
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date();
    const dow = d.getDay();
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    d.setHours(0, 0, 0, 0);

    return d;
  });

  useEffect(() => {
    if (!targetUserId) {
      return;
    }

    const unsubActivities = subscribeToCalendarEntries(
      targetUserId,
      setCalendarEntries,
    );
    const unsubNotes = subscribeToCalendarNotes(targetUserId, setCalendarNotes);
    const unsubCategories = subscribeToActivityCategories(
      targetUserId,
      setCategories,
      DEFAULT_CATEGORIES,
    );
    const unsubTrainerCal = subscribeToTrainerCalendar(
      targetUserId,
      setTrainerCalendar,
    );
    const unsubSessions = connectionId
      ? subscribeToTrainingSessions(connectionId, setTrainingSessions)
      : undefined;

    return () => {
      unsubActivities();
      unsubNotes();
      unsubCategories();
      unsubTrainerCal();
      unsubSessions?.();
    };
  }, [targetUserId, connectionId]);

  // Derive CalendarData from entries for display (activity-type entries only)
  const calendarData = useMemo((): CalendarData | null => {
    if (!calendarEntries) {
      return null;
    }
    const result: CalendarData = {};
    for (const [date, entries] of Object.entries(calendarEntries)) {
      const ids = Object.values(entries)
        .filter((e) => e.type === 'activity' && !!e.activityId)
        .map((e) => e.activityId!);
      if (ids.length > 0) {
        result[date] = ids;
      }
    }

    return result;
  }, [calendarEntries]);

  const todayKey = formatDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const monthLabel = useMemo(() => {
    const date = new Date(currentYear, currentMonth);

    return date.toLocaleDateString(i18n.language, {
      month: 'long',
      year: 'numeric',
    });
  }, [currentYear, currentMonth, i18n.language]);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToTodayMonth = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // Week navigation
  const goToPrevWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);

      return d;
    });
  };

  const goToNextWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);

      return d;
    });
  };

  const goToToday = () => {
    const d = new Date();
    const dow = d.getDay();
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    d.setHours(0, 0, 0, 0);
    setWeekStart(d);
  };

  const weekLabel = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const opts: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    const startStr = weekStart.toLocaleDateString(i18n.language, opts);
    const endStr = end.toLocaleDateString(i18n.language, {
      ...opts,
      year: 'numeric',
    });

    return `${startStr} \u2013 ${endStr}`;
  }, [weekStart, i18n.language]);

  const weekDaysData = useMemo(() => {
    const dayNames = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateKey = formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
      days.push({
        day: d.getDate(),
        dateKey,
        dayName: dayNames[i],
        isToday: dateKey === todayKey,
      });
    }

    return days;
  }, [weekStart, todayKey]);

  // Trainer activity category (the one with trainerId set, not archived) — used for new toggles
  const trainerCategory = useMemo(
    () => categories.find((c) => c.trainerId && !c.archived) ?? null,
    [categories],
  );

  // Any trainer category (prefer active, fall back to archived) — used to render historical trainer days
  const trainerCategoryForDisplay = useMemo(
    () => trainerCategory ?? categories.find((c) => !!c.trainerId) ?? null,
    [categories, trainerCategory],
  );

  // Map training sessions by date for quick lookup
  const sessionsByDate = useMemo(() => {
    if (!connectionId) {
      return new Map<string, ITrainingSession>();
    }
    const map = new Map<string, ITrainingSession>();
    for (const s of trainingSessions) {
      if (s.status !== 'cancelled') {
        map.set(s.date, s);
      }
    }

    return map;
  }, [connectionId, trainingSessions]);

  // Categories available for the activity picker (excludes archived and trainer-linked when not in trainer mode)
  const pickableCategories = useMemo(
    () =>
      categories.filter(
        (c) => !c.archived && !(c.trainerId && !allowTrainerToggle),
      ),
    [categories, allowTrainerToggle],
  );

  const toggleActivity = useCallback(
    async (dateKey: string, activity: CalendarActivity) => {
      if (!user || readOnly) {
        return;
      }

      // Trainer-linked activity: trainee cannot toggle it (only trainer manages via supervised view)
      if (trainerCategory && activity === trainerCategory.id) {
        return;
      }

      const current = calendarData?.[dateKey] ?? [];
      const updated = current.includes(activity)
        ? current.filter((a) => a !== activity)
        : [...current, activity];

      try {
        await saveCalendarDay(user.uid, dateKey, updated);
      } catch {
        toast.error(t('common.saveError'));
      }
    },
    [user, calendarData, trainerCategory, t, readOnly],
  );

  /** Merge regular calendar activities with trainer calendar data for a given date */
  const getActivitiesForDay = useCallback(
    (dateKey: string): CalendarActivity[] => {
      const regular = calendarData?.[dateKey] ?? [];
      if (trainerCategoryForDisplay && trainerCalendar?.[dateKey]) {
        // Inject trainer activity if not already in the regular list
        if (!regular.includes(trainerCategoryForDisplay.id)) {
          return [...regular, trainerCategoryForDisplay.id];
        }
      }

      return regular;
    },
    [calendarData, trainerCalendar, trainerCategoryForDisplay],
  );

  /** Add trainer-marked activity on a day (writes to trainerCalendar node + training session) */
  const toggleTrainerActivity = useCallback(
    async (dateKey: string) => {
      if (!targetUserId || !trainerCategory || !connectionId || !user) {
        return;
      }

      const isTrainerMarked = trainerCalendar?.[dateKey] === true;
      const inRegular = (calendarData?.[dateKey] ?? []).includes(
        trainerCategory.id,
      );
      const hasSession = sessionsByDate.has(dateKey);
      const isActive = isTrainerMarked || inRegular || hasSession;

      // Only allow adding — removal is done from sessions panel
      if (isActive) {
        return;
      }

      if (trainerToggleInFlight.current.has(dateKey)) {
        return;
      }
      trainerToggleInFlight.current.add(dateKey);

      try {
        await toggleTrainerCalendarDay(targetUserId, dateKey, true);
        await createTrainingSession(
          connectionId,
          trainerCategory.trainerId!,
          targetUserId,
          dateKey,
        );
      } catch {
        // Roll back calendar marker if session creation failed
        try {
          await toggleTrainerCalendarDay(targetUserId, dateKey, false);
        } catch {
          // Ignore rollback failure
        }
        toast.error(t('common.saveError'));
      } finally {
        trainerToggleInFlight.current.delete(dateKey);
      }
    },
    [
      targetUserId,
      calendarData,
      trainerCalendar,
      trainerCategory,
      t,
      connectionId,
      user,
      sessionsByDate,
    ],
  );

  const trainerToggleInFlight = useRef(new Set<string>());
  const noteTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (noteTimerRef.current) {
        clearTimeout(noteTimerRef.current);
      }
    };
  }, []);

  const handleNoteChange = useCallback(
    (dateKey: string, value: string) => {
      if (!user || readOnly) {
        return;
      }

      if (noteTimerRef.current) {
        clearTimeout(noteTimerRef.current);
      }
      noteTimerRef.current = setTimeout(async () => {
        try {
          await saveCalendarNote(user.uid, dateKey, value);
        } catch {
          toast.error(t('common.saveError'));
        }
      }, 500);
    },
    [user, t, readOnly],
  );

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);

  // Previous month days to fill the first row
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

  const calendarDays: {
    day: number;
    dateKey: string;
    isCurrentMonth: boolean;
    isToday: boolean;
  }[] = [];

  // Previous month filler days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    calendarDays.push({
      day,
      dateKey: formatDateKey(prevYear, prevMonth, day),
      isCurrentMonth: false,
      isToday: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = formatDateKey(currentYear, currentMonth, day);
    calendarDays.push({
      day,
      dateKey,
      isCurrentMonth: true,
      isToday: dateKey === todayKey,
    });
  }

  // Next month filler days
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const remainingCells = 7 - (calendarDays.length % 7);

  if (remainingCells < 7) {
    for (let day = 1; day <= remainingCells; day++) {
      calendarDays.push({
        day,
        dateKey: formatDateKey(nextYear, nextMonth, day),
        isCurrentMonth: false,
        isToday: false,
      });
    }
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const showWeekView = isMobile || viewMode === 'week';

  return (
    <div
      className={
        'space-y-4 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-6'
      }
    >
      {/* Header with navigation */}
      <div className={'flex items-center justify-between'}>
        <h2 className={'text-xl font-semibold'}>{t('calendar.title')}</h2>

        <div className={'flex items-center gap-2'}>
          {/* View toggle - desktop only */}
          {!isMobile && (
            <Select
              onValueChange={(v) => setViewMode(v as 'month' | 'week')}
              value={viewMode}
            >
              <SelectTrigger
                className={
                  'h-8 w-auto gap-1 border-border px-2 text-xs font-medium'
                }
              >
                <SelectValue />
              </SelectTrigger>

              <SelectContent align={'end'}>
                <SelectItem value={'month'}>
                  {t('calendar.monthView')}
                </SelectItem>

                <SelectItem value={'week'}>{t('calendar.weekView')}</SelectItem>
              </SelectContent>
            </Select>
          )}

          <button
            onClick={showWeekView ? goToToday : goToTodayMonth}
            type={'button'}
            className={
              'flex h-8 cursor-pointer items-center rounded-lg border border-border bg-card px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
            }
          >
            {t('calendar.today')}
          </button>

          <button
            onClick={showWeekView ? goToPrevWeek : goToPrevMonth}
            type={'button'}
            className={
              'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
            }
          >
            <ChevronLeft className={'h-4 w-4'} />
          </button>

          <span
            className={cn(
              'text-center font-medium',
              showWeekView ? 'min-w-[120px] text-xs' : 'min-w-[140px] text-sm',
            )}
          >
            {showWeekView ? weekLabel : monthLabel}
          </span>

          <button
            onClick={showWeekView ? goToNextWeek : goToNextMonth}
            type={'button'}
            className={
              'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
            }
          >
            <ChevronRight className={'h-4 w-4'} />
          </button>
        </div>
      </div>

      {showWeekView ? (
        <div className={'flex flex-col gap-1.5'}>
          {weekDaysData.map(({ day, dateKey, dayName, isToday }) => {
            const activities = getActivitiesForDay(dateKey);
            const note = calendarNotes?.[dateKey] ?? '';
            const isTrainerDay =
              trainerCalendar?.[dateKey] === true ||
              (!!trainerCategory &&
                (calendarData?.[dateKey] ?? []).includes(trainerCategory.id)) ||
              sessionsByDate.has(dateKey);

            return (
              <div
                key={dateKey}
                className={cn(
                  'flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2',
                  isToday && 'ring-1 ring-primary/50',
                )}
              >
                {/* Day info - fixed width */}
                <div className={'flex w-14 shrink-0 flex-col items-center'}>
                  <span
                    className={
                      'text-[10px] font-medium uppercase text-muted-foreground'
                    }
                  >
                    {t(`calendar.weekDays.${dayName}`)}
                  </span>

                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
                      isToday && 'bg-primary text-primary-foreground',
                    )}
                  >
                    {day}
                  </span>
                </div>

                {/* Activities - grow to fill */}
                <div className={'flex min-w-0 flex-1 flex-wrap gap-1'}>
                  {activities.map((activityId) => {
                    const category = categories.find(
                      (c) => c.id === activityId,
                    );

                    if (!category) {
                      return null;
                    }

                    const isTrainerActivity = !!category.trainerId;
                    const sessionForDay = isTrainerActivity
                      ? sessionsByDate.get(dateKey)
                      : undefined;

                    return (
                      <div
                        key={activityId}
                        title={category.name}
                        className={cn(
                          'relative flex h-7 w-7 items-center justify-center rounded',
                          isTrainerActivity && 'ring-1 ring-primary/40',
                        )}
                        style={{
                          backgroundColor: `${ACTIVITY_COLOR_MAP[category.color] ?? '#888'}26`,
                          color: ACTIVITY_COLOR_MAP[category.color],
                        }}
                      >
                        <ActivityIcon
                          className={'h-4 w-4'}
                          iconId={category.icon}
                        />
                        {sessionForDay && (
                          <span
                            className={cn(
                              'absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-background',
                              sessionForDay.paymentStatus === 'paid' &&
                                'bg-green-500',
                              sessionForDay.paymentStatus === 'pending' &&
                                'bg-yellow-500',
                              sessionForDay.paymentStatus === 'unpaid' &&
                                'bg-red-500',
                            )}
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* Note preview inline */}
                  {note && (
                    <span
                      className={
                        'flex items-center truncate text-xs text-muted-foreground'
                      }
                    >
                      {note}
                    </span>
                  )}
                </div>

                {/* Action buttons - right side */}
                {!readOnly && (
                  <div className={'flex shrink-0 items-center gap-1'}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type={'button'}
                          className={
                            'flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
                          }
                        >
                          <Pencil className={'h-3.5 w-3.5'} />
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        align={'end'}
                        className={'space-y-1'}
                        sideOffset={4}
                      >
                        {pickableCategories.map((category) => {
                          const isActive = activities.includes(category.id);

                          return (
                            <DropdownMenuItem
                              className={cn(isActive && 'bg-accent')}
                              key={category.id}
                              onSelect={(e) => e.preventDefault()}
                              onClick={() =>
                                toggleActivity(dateKey, category.id)
                              }
                            >
                              <ActivityIcon
                                className={'h-4 w-4'}
                                iconId={category.icon}
                                style={{
                                  color: ACTIVITY_COLOR_MAP[category.color],
                                }}
                              />

                              <span className={'flex-1'}>{category.name}</span>

                              {isActive && (
                                <X
                                  className={
                                    'h-3.5 w-3.5 text-muted-foreground'
                                  }
                                />
                              )}
                            </DropdownMenuItem>
                          );
                        })}

                        {pickableCategories.length > 0 && (
                          <DropdownMenuSeparator />
                        )}

                        <DropdownMenuItem
                          onClick={() => navigate('/settings/categories')}
                        >
                          <Settings2 className={'h-4 w-4'} />

                          <span>{t('calendar.manageActivities')}</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <div
                          className={'px-2 py-1.5'}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <label
                            className={
                              'mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground'
                            }
                          >
                            <StickyNote className={'h-3.5 w-3.5'} />
                            {t('calendar.note')}
                          </label>

                          <input
                            defaultValue={note}
                            placeholder={t('calendar.notePlaceholder')}
                            type={'text'}
                            className={
                              'w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50'
                            }
                            onChange={(e) =>
                              handleNoteChange(dateKey, e.target.value)
                            }
                          />
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                {/* Trainer toggle button (visible in trainer supervised view) */}
                {allowTrainerToggle &&
                  readOnly &&
                  trainerCategory &&
                  !isTrainerDay && (
                    <div className={'flex shrink-0 items-center'}>
                      <button
                        aria-label={t('calendar.toggleTrainerSession')}
                        onClick={() => toggleTrainerActivity(dateKey)}
                        title={t('calendar.toggleTrainerSession')}
                        type={'button'}
                        className={cn(
                          'flex h-7 w-7 cursor-pointer items-center justify-center rounded border transition-colors',
                          isTrainerDay
                            ? 'border-primary/50 bg-primary/10'
                            : 'border-border bg-card hover:bg-accent',
                        )}
                        style={{
                          color: isTrainerDay
                            ? ACTIVITY_COLOR_MAP[trainerCategory.color]
                            : undefined,
                        }}
                      >
                        <ActivityIcon
                          className={'h-4 w-4'}
                          iconId={trainerCategory.icon}
                        />
                      </button>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {/* Weekday headers */}
          <div className={'grid grid-cols-7 gap-2'}>
            {weekDays.map((day) => (
              <div
                key={day}
                className={
                  'py-2 text-center text-xs font-medium text-muted-foreground'
                }
              >
                {t(`calendar.weekDays.${day.toLowerCase()}`)}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className={'grid grid-cols-7 gap-2'}>
            {calendarDays.map(({ day, dateKey, isCurrentMonth, isToday }) => {
              const activities = getActivitiesForDay(dateKey);
              const note = calendarNotes?.[dateKey] ?? '';
              const isHovered = hoveredDay === dateKey;
              const isTrainerDay =
                trainerCalendar?.[dateKey] === true ||
                (!!trainerCategory &&
                  (calendarData?.[dateKey] ?? []).includes(
                    trainerCategory.id,
                  )) ||
                sessionsByDate.has(dateKey);

              return (
                <div
                  key={dateKey}
                  onMouseEnter={() => isCurrentMonth && setHoveredDay(dateKey)}
                  className={cn(
                    'group relative flex min-h-[88px] flex-col rounded-lg border p-2 transition-colors',
                    isCurrentMonth
                      ? 'border-border bg-card hover:bg-accent/50'
                      : 'border-border bg-card opacity-50',
                    isToday && 'ring-1 ring-primary/50',
                  )}
                  onMouseLeave={() => {
                    if (dropdownOpenDay !== dateKey) {
                      setHoveredDay(null);
                    }
                  }}
                >
                  {/* Day number + note */}
                  <div className={'flex items-start justify-between gap-1'}>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        !isCurrentMonth && 'text-muted-foreground/40',
                        isToday && 'text-primary font-bold',
                      )}
                    >
                      {day}
                    </span>

                    {note && (
                      <span
                        className={
                          'max-w-[60%] truncate text-[11px] leading-tight text-muted-foreground'
                        }
                      >
                        {note}
                      </span>
                    )}
                  </div>

                  {/* Activity icons */}
                  <div className={'mt-auto flex flex-wrap gap-1'}>
                    {(activities.length > 2
                      ? activities.slice(0, 1)
                      : activities
                    ).map((activityId) => {
                      const category = categories.find(
                        (c) => c.id === activityId,
                      );

                      if (!category) {
                        return null;
                      }

                      const isTrainerActivity = !!category.trainerId;
                      const sessionForDay = isTrainerActivity
                        ? sessionsByDate.get(dateKey)
                        : undefined;

                      return (
                        <div
                          key={activityId}
                          title={category.name}
                          className={cn(
                            'relative flex h-6 w-6 items-center justify-center rounded',
                            isTrainerActivity && 'ring-1 ring-primary/40',
                          )}
                          style={{
                            backgroundColor: `${ACTIVITY_COLOR_MAP[category.color] ?? '#888'}26`,
                            color: ACTIVITY_COLOR_MAP[category.color],
                          }}
                        >
                          <ActivityIcon
                            className={'h-4 w-4'}
                            iconId={category.icon}
                          />
                          {sessionForDay && (
                            <span
                              className={cn(
                                'absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-background',
                                sessionForDay.paymentStatus === 'paid' &&
                                  'bg-green-500',
                                sessionForDay.paymentStatus === 'pending' &&
                                  'bg-yellow-500',
                                sessionForDay.paymentStatus === 'unpaid' &&
                                  'bg-red-500',
                              )}
                            />
                          )}
                        </div>
                      );
                    })}

                    {activities.length > 2 && (
                      <div
                        className={
                          'flex h-6 items-center justify-center rounded bg-muted px-1.5 text-[11px] font-medium text-muted-foreground'
                        }
                      >
                        {'+'}
                        {activities.length - 1}
                      </div>
                    )}
                  </div>

                  {/* Centered + button, visible on hover */}
                  {!readOnly && isCurrentMonth && isHovered && (
                    <div
                      className={
                        'absolute inset-0 flex items-center justify-center'
                      }
                    >
                      <DropdownMenu
                        onOpenChange={(open) => {
                          if (open) {
                            setDropdownOpenDay(dateKey);
                          } else {
                            setDropdownOpenDay(null);
                            setHoveredDay(null);
                          }
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <button
                            type={'button'}
                            className={
                              'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground'
                            }
                          >
                            <Pencil className={'h-4 w-4'} />
                          </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          align={'end'}
                          className={'space-y-1'}
                          sideOffset={4}
                        >
                          {pickableCategories.map((category) => {
                            const isActive = activities.includes(category.id);

                            return (
                              <DropdownMenuItem
                                className={cn(isActive && 'bg-accent')}
                                key={category.id}
                                onSelect={(e) => e.preventDefault()}
                                onClick={() =>
                                  toggleActivity(dateKey, category.id)
                                }
                              >
                                <ActivityIcon
                                  className={'h-4 w-4'}
                                  iconId={category.icon}
                                  style={{
                                    color: ACTIVITY_COLOR_MAP[category.color],
                                  }}
                                />

                                <span className={'flex-1'}>
                                  {category.name}
                                </span>

                                {isActive && (
                                  <X
                                    className={
                                      'h-3.5 w-3.5 text-muted-foreground'
                                    }
                                  />
                                )}
                              </DropdownMenuItem>
                            );
                          })}

                          {pickableCategories.length > 0 && (
                            <DropdownMenuSeparator />
                          )}

                          <DropdownMenuItem
                            onClick={() => navigate('/settings/categories')}
                          >
                            <Settings2 className={'h-4 w-4'} />

                            <span>{t('calendar.manageActivities')}</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <div
                            className={'px-2 py-1.5'}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <label
                              className={
                                'mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground'
                              }
                            >
                              <StickyNote className={'h-3.5 w-3.5'} />
                              {t('calendar.note')}
                            </label>

                            <input
                              defaultValue={note}
                              placeholder={t('calendar.notePlaceholder')}
                              type={'text'}
                              className={
                                'w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50'
                              }
                              onChange={(e) =>
                                handleNoteChange(dateKey, e.target.value)
                              }
                            />
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                  {/* Trainer toggle - visible on hover in supervised view */}
                  {allowTrainerToggle &&
                    readOnly &&
                    trainerCategory &&
                    !isTrainerDay &&
                    isCurrentMonth &&
                    isHovered && (
                      <div
                        className={
                          'absolute inset-0 flex items-center justify-center'
                        }
                      >
                        <button
                          aria-label={t('calendar.toggleTrainerSession')}
                          onClick={() => toggleTrainerActivity(dateKey)}
                          title={t('calendar.toggleTrainerSession')}
                          type={'button'}
                          className={cn(
                            'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border shadow-sm transition-colors',
                            isTrainerDay
                              ? 'border-primary/50 bg-primary/10'
                              : 'border-border bg-card hover:bg-accent',
                          )}
                          style={{
                            color: isTrainerDay
                              ? ACTIVITY_COLOR_MAP[trainerCategory.color]
                              : undefined,
                          }}
                        >
                          <ActivityIcon
                            className={'h-4 w-4'}
                            iconId={trainerCategory.icon}
                          />
                        </button>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

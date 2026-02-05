import type {
  CalendarActivity,
  CalendarData,
  CalendarNotes,
} from '../firebase/database';

import { cn } from '@lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Footprints,
  Layers2,
  UserCheck,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/useAuth';
import {
  saveCalendarDay,
  saveCalendarNote,
  subscribeToCalendarData,
  subscribeToCalendarNotes,
} from '../firebase/database';

const ACTIVITIES: {
  type: CalendarActivity;
  icon: typeof Dumbbell;
  colorClass: string;
  activeClass: string;
}[] = [
  {
    type: 'training',
    icon: Dumbbell,
    colorClass: 'text-orange-500',
    activeClass: 'bg-orange-500/20 text-orange-500',
  },
  {
    type: 'personal',
    icon: UserCheck,
    colorClass: 'text-blue-500',
    activeClass: 'bg-blue-500/20 text-blue-500',
  },
  {
    type: 'run',
    icon: Footprints,
    colorClass: 'text-green-500',
    activeClass: 'bg-green-500/20 text-green-500',
  },
  {
    type: 'another',
    icon: Layers2,
    colorClass: 'text-white',
    activeClass: 'bg-white/20 text-white',
  },
];

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const getFirstDayOfWeek = (year: number, month: number) => {
  const day = new Date(year, month, 1).getDay();

  // Convert Sunday=0 to Monday-first (Mon=0, Sun=6)
  return day === 0 ? 6 : day - 1;
};

const formatDateKey = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

export const Calendar = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [calendarNotes, setCalendarNotes] = useState<CalendarNotes | null>(
    null,
  );
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubActivities = subscribeToCalendarData(user.uid, setCalendarData);
    const unsubNotes = subscribeToCalendarNotes(user.uid, setCalendarNotes);

    return () => {
      unsubActivities();
      unsubNotes();
    };
  }, [user]);

  const todayKey = formatDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const monthLabel = useMemo(() => {
    const date = new Date(currentYear, currentMonth);

    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [currentYear, currentMonth]);

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

  const toggleActivity = useCallback(
    async (dateKey: string, activity: CalendarActivity) => {
      if (!user) {
        return;
      }

      const current = calendarData?.[dateKey] ?? [];
      const updated = current.includes(activity)
        ? current.filter((a) => a !== activity)
        : [...current, activity];

      await saveCalendarDay(user.uid, dateKey, updated);
    },
    [user, calendarData],
  );

  const handleNoteChange = useCallback(
    async (dateKey: string, value: string) => {
      if (!user) {
        return;
      }

      await saveCalendarNote(user.uid, dateKey, value);
    },
    [user],
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

  return (
    <div
      className={
        'space-y-4 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-6'
      }
    >
      {/* Header with navigation */}
      <div className={'flex items-center justify-between'}>
        <h2 className={'text-xl font-semibold'}>{t('calendar.title')}</h2>

        <div className={'flex items-center gap-3'}>
          <button
            onClick={goToPrevMonth}
            type={'button'}
            className={
              'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
            }
          >
            <ChevronLeft className={'h-4 w-4'} />
          </button>

          <span className={'min-w-[140px] text-center text-sm font-medium'}>
            {monthLabel}
          </span>

          <button
            onClick={goToNextMonth}
            type={'button'}
            className={
              'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
            }
          >
            <ChevronRight className={'h-4 w-4'} />
          </button>
        </div>
      </div>

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
          const activities = calendarData?.[dateKey] ?? [];
          const note = calendarNotes?.[dateKey] ?? '';
          const isHovered = hoveredDay === dateKey;

          return (
            <div
              key={dateKey}
              onMouseEnter={() => isCurrentMonth && setHoveredDay(dateKey)}
              onMouseLeave={() => setHoveredDay(null)}
              className={cn(
                'group relative flex min-h-[100px] flex-col rounded-lg border p-2 transition-colors',
                isCurrentMonth
                  ? 'border-border bg-card hover:bg-accent/50'
                  : 'border-border bg-card opacity-50',
                isToday && 'ring-1 ring-primary/50',
              )}
            >
              {/* Day number */}
              <div className={'flex items-center justify-between'}>
                <span
                  className={cn(
                    'text-sm font-medium',
                    !isCurrentMonth && 'text-muted-foreground/40',
                    isToday && 'text-primary font-bold',
                  )}
                >
                  {day}
                </span>

                {note && !isHovered && (
                  <span
                    className={'truncate text-[12px] text-muted-foreground'}
                  >
                    {note}
                  </span>
                )}
              </div>

              {/* Active activity icons */}
              <div className={'mt-auto flex flex-wrap gap-1'}>
                {activities.map((activity) => {
                  const config = ACTIVITIES.find((a) => a.type === activity);

                  if (!config) {
                    return null;
                  }

                  return (
                    <div
                      key={activity}
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded',
                        config.activeClass,
                      )}
                    >
                      <config.icon className={'h-4 w-4'} />
                    </div>
                  );
                })}
              </div>

              {/* Hover overlay with activity toggles and note */}
              {isCurrentMonth && isHovered && (
                <div
                  className={
                    'absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-background/80 backdrop-blur-sm'
                  }
                >
                  <div className={'flex items-center gap-1.5'}>
                    {ACTIVITIES.map(
                      ({ type, icon: Icon, colorClass, activeClass }) => {
                        const isActive = activities.includes(type);

                        return (
                          <button
                            key={type}
                            onClick={() => toggleActivity(dateKey, type)}
                            title={t(`calendar.activities.${type}`)}
                            type={'button'}
                            className={cn(
                              'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition-all hover:scale-110',
                              isActive
                                ? activeClass + ' border-transparent'
                                : 'border-border bg-card ' +
                                    colorClass +
                                    ' opacity-50 hover:opacity-100',
                            )}
                          >
                            <Icon className={'h-5 w-5'} />
                          </button>
                        );
                      },
                    )}
                  </div>

                  {/* Note input */}
                  <input
                    defaultValue={note}
                    onChange={(e) => handleNoteChange(dateKey, e.target.value)}
                    placeholder={t('calendar.notePlaceholder')}
                    type={'text'}
                    className={
                      'mx-2 w-[calc(100%-16px)] rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50'
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

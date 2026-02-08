import type {
  ActivityCategory,
  CalendarActivity,
  CalendarData,
  CalendarNotes,
} from '../firebase/database';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@components/ui/popover';
import { cn } from '@lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings2,
  StickyNote,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  ACTIVITY_COLOR_MAP,
  DEFAULT_CATEGORIES,
} from '../constants/activities';
import { useAuth } from '../contexts/useAuth';
import {
  saveCalendarDay,
  saveCalendarNote,
  subscribeToActivityCategories,
  subscribeToCalendarData,
  subscribeToCalendarNotes,
} from '../firebase/database';
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

export const Calendar = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [calendarNotes, setCalendarNotes] = useState<CalendarNotes | null>(
    null,
  );
  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [dropdownOpenDay, setDropdownOpenDay] = useState<string | null>(null);
  const [notePopoverDay, setNotePopoverDay] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubActivities = subscribeToCalendarData(user.uid, setCalendarData);
    const unsubNotes = subscribeToCalendarNotes(user.uid, setCalendarNotes);
    const unsubCategories = subscribeToActivityCategories(
      user.uid,
      setCategories,
      DEFAULT_CATEGORIES,
    );

    return () => {
      unsubActivities();
      unsubNotes();
      unsubCategories();
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
              className={cn(
                'group relative flex min-h-[100px] flex-col rounded-lg border p-2 transition-colors',
                isCurrentMonth
                  ? 'border-border bg-card hover:bg-accent/50'
                  : 'border-border bg-card opacity-50',
                isToday && 'ring-1 ring-primary/50',
              )}
              onMouseLeave={() => {
                if (dropdownOpenDay !== dateKey && notePopoverDay !== dateKey) {
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

              {/* Activity icons + action buttons */}
              <div className={'mt-auto flex items-end justify-between'}>
                {/* Activity icons - left side, hoverable to remove */}
                <div className={'flex flex-wrap gap-1'}>
                  {activities.map((activityId) => {
                    const category = categories.find(
                      (c) => c.id === activityId,
                    );

                    if (!category) {
                      return null;
                    }

                    return (
                      <button
                        key={activityId}
                        onClick={() => toggleActivity(dateKey, activityId)}
                        title={category.name}
                        type={'button'}
                        className={
                          'group/act flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-colors'
                        }
                        style={{
                          backgroundColor: `${ACTIVITY_COLOR_MAP[category.color] ?? '#888'}26`,
                          color: ACTIVITY_COLOR_MAP[category.color],
                        }}
                      >
                        <ActivityIcon
                          className={'block h-4 w-4 group-hover/act:hidden'}
                          iconId={category.icon}
                        />

                        <X className={'hidden h-4 w-4 group-hover/act:block'} />
                      </button>
                    );
                  })}
                </div>

                {/* Action buttons - bottom right, visible on hover */}
                {isCurrentMonth && isHovered && (
                  <div className={'flex items-center gap-1'}>
                    {/* Add activity dropdown */}
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
                            'flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
                          }
                        >
                          <Plus className={'h-4 w-4'} />
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align={'end'} sideOffset={4}>
                        {categories
                          .filter((c) => !activities.includes(c.id))
                          .map((category) => (
                            <DropdownMenuItem
                              key={category.id}
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

                              <span>{category.name}</span>
                            </DropdownMenuItem>
                          ))}

                        {categories.filter((c) => !activities.includes(c.id))
                          .length > 0 && <DropdownMenuSeparator />}

                        <DropdownMenuItem
                          onClick={() => navigate('/settings/categories')}
                        >
                          <Settings2 className={'h-4 w-4'} />

                          <span>{t('calendar.manageActivities')}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Note popover */}
                    <Popover
                      onOpenChange={(open) => {
                        if (open) {
                          setNotePopoverDay(dateKey);
                        } else {
                          setNotePopoverDay(null);
                          setHoveredDay(null);
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type={'button'}
                          className={cn(
                            'flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-border bg-card transition-colors hover:bg-accent hover:text-foreground',
                            note ? 'text-primary' : 'text-muted-foreground',
                          )}
                        >
                          <StickyNote className={'h-4 w-4'} />
                        </button>
                      </PopoverTrigger>

                      <PopoverContent
                        align={'end'}
                        className={'w-56 p-3'}
                        sideOffset={4}
                      >
                        <div className={'space-y-2'}>
                          <label
                            className={
                              'text-xs font-medium text-muted-foreground'
                            }
                          >
                            {t('calendar.note')}
                          </label>

                          <input
                            autoFocus
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
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

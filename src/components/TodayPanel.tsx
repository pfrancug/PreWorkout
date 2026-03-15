import type { IRow } from '@app-types/types';
import type {
  IActivityCategory,
  ICalendarEntries,
  ICalendarEntry,
  ICalendarNotes,
} from '@firebase-config/database';

import { ActivityIcon } from '@components/ActivityIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Switch } from '@components/ui/switch';
import { Textarea } from '@components/ui/textarea';
import { ACTIVITY_COLOR_MAP, DEFAULT_CATEGORIES } from '@constants/activities';
import { EM_DASH } from '@constants/display';
import { useAuth } from '@contexts/useAuth';
import { useDataSet } from '@contexts/useDataSet';
import {
  createCalendarEntry,
  deleteCalendarEntry,
  saveCalendarNote,
  subscribeToActivityCategories,
  subscribeToCalendarEntries,
  subscribeToCalendarNotes,
} from '@firebase-config/database';
import { Plus, Settings2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const TodayPanel = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { dataSet, setDataSet } = useDataSet();

  const today = useMemo(() => new Date(), []);
  const todayKey = formatDateKey(today);

  const todayLabel = today.toLocaleDateString(i18n.language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Calendar data (activities & notes)
  const [calendarEntries, setCalendarEntries] =
    useState<ICalendarEntries | null>(null);
  const [calendarNotes, setCalendarNotes] = useState<ICalendarNotes | null>(
    null,
  );
  const [categories, setCategories] = useState<IActivityCategory[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubEntries = subscribeToCalendarEntries(
      user.uid,
      setCalendarEntries,
    );
    const unsubNotes = subscribeToCalendarNotes(user.uid, setCalendarNotes);
    const unsubCategories = subscribeToActivityCategories(
      user.uid,
      setCategories,
      DEFAULT_CATEGORIES,
    );

    return () => {
      unsubEntries();
      unsubNotes();
      unsubCategories();
    };
  }, [user]);

  const todayEntries: ICalendarEntry[] = calendarEntries?.[todayKey]
    ? Object.values(calendarEntries[todayKey])
    : [];
  const activityEntries = todayEntries.filter(
    (e) => e.type === 'activity' && e.activityId && e.time == null,
  );
  const note = calendarNotes?.[todayKey] ?? '';

  const toggleActivity = useCallback(
    async (activityId: string) => {
      if (!user) {
        return;
      }

      const existing = activityEntries.find((e) => e.activityId === activityId);

      try {
        if (existing) {
          await deleteCalendarEntry(user.uid, todayKey, existing.id);
        } else {
          await createCalendarEntry(user.uid, todayKey, {
            type: 'activity',
            activityId,
            time: null,
          });
        }
      } catch {
        toast.error(t('common.saveError'));
      }
    },
    [user, activityEntries, todayKey, t],
  );

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
    (value: string) => {
      if (!user) {
        return;
      }

      if (noteTimerRef.current) {
        clearTimeout(noteTimerRef.current);
      }
      noteTimerRef.current = setTimeout(async () => {
        try {
          await saveCalendarNote(user.uid, todayKey, value);
        } catch {
          toast.error(t('common.saveError'));
        }
      }, 500);
    },
    [user, todayKey, t],
  );

  // Diary data for today
  const todayRow = useMemo(() => {
    if (!dataSet) {
      return null;
    }

    return dataSet.find((row) => {
      const rowKey = formatDateKey(row.date);

      return rowKey === todayKey;
    });
  }, [dataSet, todayKey]);

  const updateTodayField = useCallback(
    (field: keyof IRow, value: number | null | boolean) => {
      setDataSet((prev) => {
        if (!prev) {
          return prev;
        }

        const idx = prev.findIndex(
          (row) => formatDateKey(row.date) === todayKey,
        );

        if (idx === -1) {
          // Create new row for today
          const newRow: IRow = {
            id: Date.now(),
            date: new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate(),
            ),
            weight: null,
            kcal: null,
            protein: null,
            fat: null,
            carbs: null,
            completed: false,
            [field]: value,
          };

          return [...prev, newRow];
        }

        const updated = [...prev];
        updated[idx] = { ...updated[idx], [field]: value };

        return updated;
      });
    },
    [setDataSet, todayKey, today],
  );

  const handleNumericChange = (field: keyof IRow, raw: string) => {
    if (raw === '') {
      updateTodayField(field, null);

      return;
    }
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      updateTodayField(field, num);
    }
  };

  const macroFields = [
    {
      key: 'weight' as const,
      labelKey: 'today.weight',
      unit: 'kg',
      step: '0.1',
    },
    {
      key: 'kcal' as const,
      labelKey: 'today.calories',
      unit: 'kcal',
      step: '1',
    },
    {
      key: 'protein' as const,
      labelKey: 'today.protein',
      unit: 'g',
      step: '1',
    },
    { key: 'fat' as const, labelKey: 'today.fat', unit: 'g', step: '1' },
    { key: 'carbs' as const, labelKey: 'today.carbs', unit: 'g', step: '1' },
  ];

  return (
    <div
      className={
        'space-y-4 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-6'
      }
    >
      {/* Header */}
      <div className={'flex items-start justify-between'}>
        <div>
          <h2 className={'text-lg font-semibold'}>{t('today.title')}</h2>

          <p className={'text-sm capitalize text-muted-foreground'}>
            {todayLabel}
          </p>
        </div>

        <div className={'flex items-center gap-2'}>
          <Label
            className={'text-xs text-muted-foreground'}
            htmlFor={'today-completed'}
          >
            {t('table.completed')}
          </Label>

          <Switch
            checked={todayRow?.completed ?? false}
            id={'today-completed'}
            size={'sm'}
            onCheckedChange={(checked) =>
              updateTodayField('completed', checked)
            }
          />
        </div>
      </div>

      {/* Macro inputs */}
      <div className={'grid grid-cols-2 gap-3 lg:grid-cols-5'}>
        {macroFields.map(({ key, labelKey, unit, step }) => (
          <div className={'space-y-1'} key={key}>
            <Label className={'text-xs text-muted-foreground'}>
              {t(labelKey)}{' '}
              <span className={'text-muted-foreground/60'}>{unit}</span>
            </Label>

            <Input
              className={'h-9'}
              min={0}
              onChange={(e) => handleNumericChange(key, e.target.value)}
              placeholder={EM_DASH}
              step={step}
              type={'number'}
              value={todayRow?.[key] ?? ''}
            />
          </div>
        ))}
      </div>

      {/* Activities */}
      <div className={'space-y-2'}>
        <span className={'text-xs font-medium text-muted-foreground'}>
          {t('today.activities')}
        </span>

        <div className={'flex flex-wrap items-center gap-1.5'}>
          {activityEntries.length === 0 && (
            <span
              className={
                'flex h-8 items-center rounded-md border border-dashed border-border px-2.5 text-xs text-muted-foreground'
              }
            >
              {t('today.noActivities')}
            </span>
          )}

          {activityEntries.map((entry) => {
            const category = categories.find((c) => c.id === entry.activityId);

            if (!category) {
              return null;
            }

            return (
              <button
                key={entry.id}
                onClick={() => toggleActivity(entry.activityId!)}
                title={category.name}
                type={'button'}
                className={
                  'flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors hover:opacity-80'
                }
                style={{
                  backgroundColor: `${ACTIVITY_COLOR_MAP[category.color] ?? '#888'}26`,
                  color: ACTIVITY_COLOR_MAP[category.color],
                }}
              >
                <ActivityIcon className={'h-4 w-4'} iconId={category.icon} />

                <span>{category.name}</span>

                <X className={'ml-0.5 h-3 w-3 opacity-60'} />
              </button>
            );
          })}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type={'button'}
                className={
                  'flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
                }
              >
                <Plus className={'h-3.5 w-3.5'} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align={'start'} sideOffset={4}>
              {categories
                .filter(
                  (c) => !activityEntries.some((e) => e.activityId === c.id),
                )
                .map((category) => (
                  <DropdownMenuItem
                    key={category.id}
                    onClick={() => toggleActivity(category.id)}
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

              {categories.filter(
                (c) => !activityEntries.some((e) => e.activityId === c.id),
              ).length > 0 && <DropdownMenuSeparator />}

              <DropdownMenuItem
                onClick={() => navigate('/settings/categories')}
              >
                <Settings2 className={'h-4 w-4'} />

                <span>{t('calendar.manageActivities')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Note */}
      <div className={'space-y-1'}>
        <Label className={'text-xs text-muted-foreground'}>
          {t('calendar.note')}
        </Label>

        <Textarea
          className={'min-h-[60px] resize-none text-sm'}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder={t('calendar.notePlaceholder')}
          value={note}
        />
      </div>
    </div>
  );
};

import type { ActivityCategory } from '../firebase/database';

import { cn } from '@lib/utils';
import { Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ACTIVITY_COLOR_MAP } from '../constants/activities';
import { ActivityIcon } from './ActivityIcon';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Textarea } from './ui/textarea';

interface ActivityNoteModalProps {
  /** YYYY-MM-DD date for this modal */
  date: string;
  /** Pickable categories (non-archived, non-trainer-linked) */
  categories: ActivityCategory[];
  /** Active activity IDs for this date */
  activities: string[];
  /** Current note text */
  note: string;
  /** Per-activity notes keyed by activityId */
  activityNotes: Record<string, string>;
  onToggleActivity: (activityId: string) => Promise<void>;
  /** Called on every keystroke; caller is responsible for debouncing */
  onNoteChange: (value: string) => void;
  onActivityNoteChange: (activityId: string, value: string) => void;
  onClose: () => void;
}

export const ActivityNoteModal = ({
  date,
  categories,
  activities,
  note,
  activityNotes,
  onToggleActivity,
  onNoteChange,
  onActivityNoteChange,
  onClose,
}: ActivityNoteModalProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString(
    i18n.language,
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  );

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent
        className={'flex flex-col gap-5 overflow-y-auto'}
        side={'right'}
      >
        <SheetHeader>
          <SheetTitle className={'text-base'}>{formattedDate}</SheetTitle>
        </SheetHeader>

        {/* Activities */}
        <div className={'space-y-2'}>
          <p className={'text-sm font-medium'}>
            {t('calendar.editActivities')}
          </p>

          {categories.length > 0 ? (
            <div className={'space-y-1'}>
              {categories.map((category) => {
                const isActive = activities.includes(category.id);
                const color = ACTIVITY_COLOR_MAP[category.color] ?? '#888';

                return (
                  <div key={category.id}>
                    <button
                      onClick={() => onToggleActivity(category.id)}
                      type={'button'}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                        isActive
                          ? 'border-transparent'
                          : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                      style={
                        isActive
                          ? {
                              backgroundColor: `${color}26`,
                              borderColor: color,
                              color,
                            }
                          : undefined
                      }
                    >
                      <ActivityIcon
                        className={'h-4 w-4 shrink-0'}
                        iconId={category.icon}
                      />
                      <span className={'flex-1 text-left'}>
                        {category.name}
                      </span>
                    </button>
                    {isActive && (
                      <div className={'mt-1.5 pl-3'}>
                        <Textarea
                          className={'resize-none text-sm'}
                          defaultValue={activityNotes[category.id] ?? ''}
                          key={`${date}-${category.id}`}
                          placeholder={t('calendar.activityNotePlaceholder')}
                          rows={2}
                          onChange={(e) =>
                            onActivityNoteChange(category.id, e.target.value)
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}

          <button
            type={'button'}
            className={
              'flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground'
            }
            onClick={() => {
              navigate('/settings/categories');
              onClose();
            }}
          >
            <Settings2 className={'h-3.5 w-3.5'} />
            {t('calendar.manageActivities')}
          </button>
        </div>

        {/* Note */}
        <div className={'space-y-2'}>
          <label className={'text-sm font-medium'}>
            {t('calendar.dayNote')}
          </label>
          <Textarea
            className={'resize-none text-sm'}
            defaultValue={note}
            key={date}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder={t('calendar.notePlaceholder')}
            rows={4}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

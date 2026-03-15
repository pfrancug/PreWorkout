import type { ITrainingSession } from '@app-types/types';
import type {
  ActivityCategory,
  CalendarEntries,
  CalendarEntry,
  CalendarNotes,
  TrainerCalendarData,
} from '@firebase-config/database';
import type { TFunction } from 'i18next';

export interface TimePreset {
  startStr: string;
  endStr: string;
  allDay: boolean;
}

export type DrawerView =
  | { view: 'day'; date: string; timePreset?: TimePreset | null }
  | { view: 'event'; date: string; entryId: string }
  | { view: 'add'; date: string; timePreset: TimePreset | null }
  | { view: 'add-training'; date: string; timePreset?: TimePreset | null }
  | { view: 'note'; date: string };

export interface AddTrainingViewProps {
  date: string;
  timePreset?: TimePreset | null;
  onBack: () => void;
  onSave: (
    dateKey: string,
    time: string | null,
    timeEnd: string | null,
    note: string,
  ) => Promise<void>;
}

export interface AddViewProps {
  date: string;
  timePreset: TimePreset | null;
  categories: ActivityCategory[];
  recentActivityIds: string[];
  onBack: () => void;
  onAddEntry: (entry: Omit<CalendarEntry, 'id'>) => Promise<void>;
  onSaveNewCategory: (category: ActivityCategory) => Promise<void>;
}

export interface MapCalendarEventsParams {
  calendarEntries: CalendarEntries | null;
  calendarNotes: CalendarNotes | null;
  trainerCalendar: TrainerCalendarData | null;
  categories: ActivityCategory[];
  trainingSessions: ITrainingSession[];
  trainerCategoryForDisplay: ActivityCategory | null;
  t: TFunction;
}

export interface DayViewProps {
  date: string;
  categories: ActivityCategory[];
  entries: CalendarEntry[];
  note: string;
  readOnly?: boolean;
  onTrainerToggle?: (
    dateKey: string,
    time: string | null,
    timeEnd: string | null,
    note: string,
  ) => Promise<void>;
  onNavigateToEvent: (entryId: string) => void;
  onNavigateToAdd: () => void;
  onNavigateToAddTraining: () => void;
  onNavigateToNote: () => void;
}

export interface EventViewProps {
  date: string;
  entry: CalendarEntry;
  categories: ActivityCategory[];
  onBack: () => void;
  onDelete: () => void;
  onUpdateNote: (note: string) => void;
  onUpdateTime: (time: string | null, timeEnd?: string | null) => void;
}

export interface NoteViewProps {
  note: string;
  onBack: () => void;
  onNoteChange: (value: string) => void;
}

export interface GetDrawerEntriesParams {
  date: string | null;
  calendarEntries: CalendarEntries | null;
  trainerCalendar: TrainerCalendarData | null;
  trainerCategoryForDisplay: ActivityCategory | null;
  trainingSessions: ITrainingSession[];
}

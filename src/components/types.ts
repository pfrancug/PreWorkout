import type { DrawerView } from './calendar/types';
import type { IRow } from '@app-types/types';
import type { ActivityIconId } from '@constants/activities';
import type {
  IActivityCategory,
  ICalendarEntry,
} from '@firebase-config/database';

export interface ActivityNoteModalProps {
  drawerView: DrawerView;
  categories: IActivityCategory[];
  pickableCategories?: IActivityCategory[];
  entries: ICalendarEntry[];
  recentActivityIds: string[];
  note: string;
  readOnly?: boolean;
  onTrainerToggle?: (
    dateKey: string,
    time: string | null,
    timeEnd: string | null,
    note: string,
  ) => Promise<void>;
  onNavigate: (next: DrawerView) => void;
  onClose: () => void;
  onNoteChange: (value: string) => void;
  onAddEntry: (entry: Omit<ICalendarEntry, 'id'>) => Promise<void>;
  onDeleteEntry: (entryId: string, date: string) => Promise<void>;
  onUpdateEntryNote: (entryId: string, date: string, note: string) => void;
  onUpdateEntryTime: (
    entryId: string,
    date: string,
    time: string | null,
    timeEnd?: string | null,
  ) => void;
  onSaveNewCategory: (category: IActivityCategory) => Promise<void>;
}

export interface ChatProps {
  dataset: IRow[] | null;
  variant?: 'drawer' | 'page';
}

export interface Message {
  attachedDataset?: IRow[];
  parts: { text: string }[];
  role: string;
}

export interface FullCalendarViewProps {
  /** Override whose data to display (defaults to current user) */
  userId?: string;
  /** When true, disable all editing (activity toggles, notes, adding entries) */
  readOnly?: boolean;
  /** Allow toggling trainer-linked activity even in readOnly mode */
  allowTrainerToggle?: boolean;
  /** The active trainer connection ID — needed for creating training sessions */
  connectionId?: string;
}

export interface IconColorPickerProps {
  icon: ActivityIconId;
  color: string;
  onIconChange: (icon: ActivityIconId) => void;
  onColorChange: (color: string) => void;
}

export interface RightPanelContextProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
}

export interface TrainingSessionsProps {
  connectionId: string;
  role: 'trainer' | 'trainee';
}

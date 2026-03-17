import type { Message } from '@components/types';
import type {
  IUserPreferences,
  IUserSettings,
} from '@contexts/SettingsContext';

export type MessageLimitMode = 'disabled' | 'limited' | 'unlimited';

export interface IMessageLimitConfig {
  mode: MessageLimitMode;
}

export interface IActivityCategory {
  id: string;
  icon: string;
  name: string;
  color: string;
  /** Archived categories still render in calendar history but don't appear in the activity picker */
  archived?: boolean;
}

export interface ICalendarNotes {
  [date: string]: string;
}

export interface ICalendarEntry {
  id: string;
  type: 'activity' | 'custom';
  /** activityId of a known category; required when type = 'activity' */
  activityId?: string;
  /** Display name; required when type = 'custom' */
  name?: string;
  /** Icon id for custom entries */
  icon?: string;
  /** Color id for custom entries */
  color?: string;
  /** HH:mm, or null for all-day */
  time: string | null;
  /** HH:mm end time, or null/undefined */
  timeEnd?: string | null;
  /** Optional note for this occurrence */
  note?: string;
}

export type ICalendarEntries = {
  [date: string]: { [entryId: string]: ICalendarEntry };
};

export interface ISharingPreferences {
  shareCalendarActivities: boolean;
  shareDiary: boolean;
}

export interface IAllUserData {
  settings: IUserSettings | null;
  preferences: IUserPreferences | null;
  sharingPreferences: ISharingPreferences | null;
  messages: Message[] | null;
  data: IRowData[] | null;
  limits: IMessageLimitConfig | null;
  /** Unified calendar entries */
  calendarEntries: ICalendarEntries | null;
  calendarNotes: ICalendarNotes | null;
  activityCategories: IActivityCategory[] | null;
}

// User Data (diary entries)
export interface IRowData {
  id: number;
  date: string; // ISO string for Firebase storage
  weight: number | null;
  kcal: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  completed?: boolean;
}

// User Directory (populated on login, admin-readable)
// Fields are optional because PII is removed on account deletion while analytics are retained
export interface IUserDirectoryEntry {
  email?: string;
  displayName?: string;
  lastLogin?: string;
}

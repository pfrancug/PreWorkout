import type { ISharingPreferences } from '@firebase-config/database';

import { createContext } from 'react';

export interface IUserSettings {
  name: string;
  age: string;
  height: string;
  sex: 'male' | 'female' | '';
  avatarUrl?: string;
}

export interface IUserPreferences {
  sidebarOpen: boolean;
  chatPanelOpen: boolean;
  language: string;
  defaultCalendarView: 'month' | 'week';
  hideConnectionSection: boolean;
}

export interface SettingsContextValue {
  settings: IUserSettings;
  preferences: IUserPreferences;
  sharingPreferences: ISharingPreferences;
  updatePreference: (
    field: keyof IUserPreferences,
    value: boolean | string,
  ) => void;
  updateSharingPreference: (
    field: keyof ISharingPreferences,
    value: boolean,
  ) => void;
  saveSettings: (newSettings: IUserSettings) => Promise<void>;
  changeLanguage: (lang: string) => void;
}

export const defaultSettings: IUserSettings = {
  name: '',
  age: '',
  height: '',
  sex: '',
};

export const defaultPreferences: IUserPreferences = {
  sidebarOpen: true,
  chatPanelOpen: false,
  language: localStorage.getItem('i18nextLng') || 'en',
  defaultCalendarView: 'month',
  hideConnectionSection: false,
};

export const defaultSharingPreferences: ISharingPreferences = {
  shareCalendarActivities: false,
  shareDiary: false,
};

export const SettingsContext = createContext<SettingsContextValue | null>(null);

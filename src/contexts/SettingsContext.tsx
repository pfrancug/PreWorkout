import { createContext } from 'react';

export interface UserSettings {
  name: string;
  age: string;
  height: string;
  sex: 'male' | 'female' | '';
  avatarUrl?: string;
}

export interface UserPreferences {
  sidebarOpen: boolean;
  chatPanelOpen: boolean;
  language: string;
  defaultCalendarView: 'month' | 'week';
}

export interface SettingsContextValue {
  settings: UserSettings;
  preferences: UserPreferences;
  updatePreference: (
    field: keyof UserPreferences,
    value: boolean | string,
  ) => void;
  saveSettings: (newSettings: UserSettings) => Promise<void>;
  changeLanguage: (lang: string) => void;
}

export const defaultSettings: UserSettings = {
  name: '',
  age: '',
  height: '',
  sex: '',
};

export const defaultPreferences: UserPreferences = {
  sidebarOpen: true,
  chatPanelOpen: false,
  language: localStorage.getItem('i18nextLng') || 'en',
  defaultCalendarView: 'month',
};

export const SettingsContext = createContext<SettingsContextValue | null>(null);

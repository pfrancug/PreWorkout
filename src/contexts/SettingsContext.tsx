import { createContext } from 'react';

export interface UserSettings {
  name: string;
  age: string;
  height: string;
  sex: 'male' | 'female' | '';
}

export interface UserPreferences {
  sidebarOpen: boolean;
  chatPanelOpen: boolean;
}

export interface SettingsContextValue {
  settings: UserSettings;
  preferences: UserPreferences;
  updatePreference: (field: keyof UserPreferences, value: boolean) => void;
  saveSettings: (newSettings: UserSettings) => Promise<void>;
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
};

export const SettingsContext = createContext<SettingsContextValue | null>(null);

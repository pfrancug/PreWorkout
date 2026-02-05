import { createContext } from 'react';

export interface UserSettings {
  name: string;
  age: string;
  height: string;
  sex: 'male' | 'female' | '';
}

export interface SettingsContextValue {
  settings: UserSettings;
  updateSettings: (settings: UserSettings) => void;
  updateField: (field: keyof UserSettings, value: string) => void;
}

export const defaultSettings: UserSettings = {
  name: '',
  age: '',
  height: '',
  sex: '',
};

export const SettingsContext = createContext<SettingsContextValue | null>(null);

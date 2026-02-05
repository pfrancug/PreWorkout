import type { UserSettings } from './SettingsContext';

import { useCallback, useState } from 'react';

import { STORAGE_KEYS } from '../constants/storage';
import { defaultSettings, SettingsContext } from './SettingsContext';

function getInitialSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Invalid JSON
  }

  return defaultSettings;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(getInitialSettings);

  const updateSettings = useCallback((newSettings: UserSettings) => {
    setSettings(newSettings);
    localStorage.setItem(
      STORAGE_KEYS.USER_SETTINGS,
      JSON.stringify(newSettings),
    );
  }, []);

  const updateField = useCallback(
    (field: keyof UserSettings, value: string) => {
      setSettings((prev) => {
        const updated = { ...prev, [field]: value };
        localStorage.setItem(
          STORAGE_KEYS.USER_SETTINGS,
          JSON.stringify(updated),
        );

        return updated;
      });
    },
    [],
  );

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, updateField }}>
      {children}
    </SettingsContext.Provider>
  );
}

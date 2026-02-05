import type { UserSettings } from './SettingsContext';

import { useCallback, useEffect, useRef, useState } from 'react';

import { loadUserSettings, saveUserSettings } from '../firebase/database';
import { defaultSettings, SettingsContext } from './SettingsContext';
import { useAuth } from './useAuth';

async function fetchUserSettings(userId: string | null): Promise<UserSettings> {
  if (!userId) {
    return defaultSettings;
  }

  const firebaseSettings = await loadUserSettings(userId);

  return firebaseSettings ?? defaultSettings;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const prevUserId = useRef<string | null>(null);

  // Load settings from Firebase when user changes
  useEffect(() => {
    const currentUserId = user?.uid ?? null;

    // Skip if user hasn't changed
    if (currentUserId === prevUserId.current) {
      return;
    }

    prevUserId.current = currentUserId;

    let cancelled = false;

    fetchUserSettings(currentUserId).then((loadedSettings) => {
      if (!cancelled) {
        setSettings(loadedSettings);
        setIsLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const updateSettings = useCallback(
    (newSettings: UserSettings) => {
      setSettings(newSettings);
      if (user) {
        saveUserSettings(user.uid, newSettings);
      }
    },
    [user],
  );

  const updateField = useCallback(
    (field: keyof UserSettings, value: string) => {
      setSettings((prev) => {
        const updated = { ...prev, [field]: value };
        if (user) {
          saveUserSettings(user.uid, updated);
        }

        return updated;
      });
    },
    [user],
  );

  // Don't render children until auth and settings are loaded
  if (authLoading || !isLoaded) {
    return null;
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, updateField }}>
      {children}
    </SettingsContext.Provider>
  );
}

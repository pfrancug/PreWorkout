import type { UserPreferences, UserSettings } from './SettingsContext';
import type { ReactNode } from 'react';

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Loader } from '../components/Loader';
import {
  loadUserPreferences,
  loadUserSettings,
  saveUserPreferences,
  saveUserSettings,
  updateUserDirectory,
} from '../firebase/database';
import {
  defaultPreferences,
  defaultSettings,
  SettingsContext,
} from './SettingsContext';
import { useAuth } from './useAuth';

const fetchUserSettings = async (
  userId: string | null,
): Promise<UserSettings> => {
  if (!userId) {
    return defaultSettings;
  }

  const firebaseSettings = await loadUserSettings(userId);

  return firebaseSettings ?? defaultSettings;
};

const fetchUserPreferences = async (
  userId: string | null,
): Promise<UserPreferences> => {
  if (!userId) {
    return defaultPreferences;
  }

  const firebasePreferences = await loadUserPreferences(userId);

  return firebasePreferences
    ? { ...defaultPreferences, ...firebasePreferences }
    : defaultPreferences;
};

type SettingsState =
  | { status: 'loading' }
  | {
      status: 'loaded';
      settings: UserSettings;
      preferences: UserPreferences;
    };

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { i18n } = useTranslation();
  const [state, setState] = useState<SettingsState>({ status: 'loading' });
  const prevUserId = useRef<string | null | undefined>(undefined);

  // Load settings from Firebase when user changes
  useEffect(() => {
    const currentUserId = user?.uid ?? null;

    // Skip if user hasn't changed (but not on first run)
    if (
      prevUserId.current !== undefined &&
      currentUserId === prevUserId.current
    ) {
      return;
    }

    prevUserId.current = currentUserId;

    // Reset to loading state for new user
    startTransition(() => {
      setState({ status: 'loading' });
    });

    Promise.all([
      fetchUserSettings(currentUserId),
      fetchUserPreferences(currentUserId),
    ]).then(([loadedSettings, loadedPreferences]) => {
      // Apply saved language preference
      if (
        loadedPreferences.language &&
        loadedPreferences.language !== i18n.language
      ) {
        i18n.changeLanguage(loadedPreferences.language);
        localStorage.setItem('i18nextLng', loadedPreferences.language);
      }

      startTransition(() => {
        setState({
          status: 'loaded',
          settings: loadedSettings,
          preferences: loadedPreferences,
        });
      });
    });
  }, [user, i18n]);

  const updatePreference = useCallback(
    (field: keyof UserPreferences, value: boolean | string) => {
      setState((prev) => {
        if (prev.status !== 'loaded') {
          return prev;
        }

        const updated = { ...prev.preferences, [field]: value };
        if (user) {
          saveUserPreferences(user.uid, updated).catch(() => {
            toast.error('Failed to save preferences.');
          });
        }

        return { ...prev, preferences: updated };
      });
    },
    [user],
  );

  const changeLanguage = useCallback(
    (lang: string) => {
      i18n.changeLanguage(lang);
      localStorage.setItem('i18nextLng', lang);
      updatePreference('language', lang);
    },
    [i18n, updatePreference],
  );

  const saveSettings = useCallback(
    async (newSettings: UserSettings) => {
      if (user) {
        try {
          await saveUserSettings(user.uid, newSettings);
          // Sync display name to userDirectory so trainers/trainees see the updated name
          updateUserDirectory(
            user.uid,
            user.email ?? '',
            newSettings.name,
          ).catch(() => {});
          setState((prev) => {
            if (prev.status !== 'loaded') {
              return prev;
            }

            return { ...prev, settings: newSettings };
          });
        } catch {
          toast.error('Failed to save settings.');
          throw new Error('Save failed');
        }
      }
    },
    [user],
  );

  // Don't render children until auth and settings are loaded
  if (authLoading || state.status === 'loading') {
    return <Loader />;
  }

  return (
    <SettingsContext.Provider
      value={{
        settings: state.settings,
        preferences: state.preferences,
        updatePreference,
        saveSettings,
        changeLanguage,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

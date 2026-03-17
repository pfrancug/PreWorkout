import type { User } from 'firebase/auth';
import type { ReactNode } from 'react';

import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext } from './AuthContext';
import { SettingsProvider } from './SettingsProvider';
import { useSettings } from './useSettings';

// Mock Firebase database operations
const mockLoadUserSettings = vi.fn();
const mockLoadUserPreferences = vi.fn();
const mockLoadSharingPreferences = vi.fn();
const mockSaveUserSettings = vi.fn().mockResolvedValue(undefined);
const mockSaveUserPreferences = vi.fn().mockResolvedValue(undefined);
const mockSaveSharingPreferences = vi.fn().mockResolvedValue(undefined);
const mockUpdateUserDisplayName = vi.fn().mockResolvedValue(undefined);

vi.mock('@firebase-config/database', () => ({
  loadUserSettings: (...args: unknown[]) => mockLoadUserSettings(...args),
  loadUserPreferences: (...args: unknown[]) => mockLoadUserPreferences(...args),
  loadSharingPreferences: (...args: unknown[]) =>
    mockLoadSharingPreferences(...args),
  saveUserSettings: (...args: unknown[]) => mockSaveUserSettings(...args),
  saveUserPreferences: (...args: unknown[]) => mockSaveUserPreferences(...args),
  saveSharingPreferences: (...args: unknown[]) =>
    mockSaveSharingPreferences(...args),
  updateUserDisplayName: (...args: unknown[]) =>
    mockUpdateUserDisplayName(...args),
}));

// Mock Loader to avoid rendering the real component
vi.mock('@components/Loader', () => ({
  Loader: () => <div data-testid={'loader'} />,
}));

const fakeUser = {
  uid: 'user-1',
  email: 'test@test.com',
  displayName: 'Test User',
} as unknown as User;

const makeWrapper =
  (user: User | null = fakeUser) =>
  ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider
      value={{ user, loading: false, isAdmin: false, isTrainer: false }}
    >
      <SettingsProvider>{children}</SettingsProvider>
    </AuthContext.Provider>
  );

describe('SettingsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadUserSettings.mockResolvedValue({
      name: 'Test User',
      age: '30',
      height: '180',
      sex: 'male',
    });
    mockLoadUserPreferences.mockResolvedValue({
      sidebarOpen: true,
      chatPanelOpen: false,
      language: 'en',
      defaultCalendarView: 'month',
      hideConnectionSection: false,
    });
    mockLoadSharingPreferences.mockResolvedValue(null);
  });

  it('loads settings from Firebase on mount', async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.settings.name).toBe('Test User');
    });

    expect(mockLoadUserSettings).toHaveBeenCalledWith('user-1');
    expect(mockLoadUserPreferences).toHaveBeenCalledWith('user-1');
  });

  it('returns default settings when no user', async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: makeWrapper(null),
    });

    await waitFor(() => {
      expect(result.current.settings.name).toBe('');
    });

    expect(result.current.settings.sex).toBe('');
  });

  it('returns default preferences when Firebase returns null', async () => {
    mockLoadUserPreferences.mockResolvedValue(null);

    const { result } = renderHook(() => useSettings(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.settings.name).toBe('Test User');
    });

    expect(result.current.preferences.sidebarOpen).toBe(true);
    expect(result.current.preferences.language).toBe('en');
  });

  it('saves settings to Firebase via saveSettings', async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.settings.name).toBe('Test User');
    });

    const newSettings = {
      name: 'Updated',
      age: '25',
      height: '175',
      sex: 'female' as const,
    };

    await act(async () => {
      await result.current.saveSettings(newSettings);
    });

    expect(mockSaveUserSettings).toHaveBeenCalledWith('user-1', newSettings);
    expect(mockUpdateUserDisplayName).toHaveBeenCalledWith('user-1', 'Updated');
  });

  it('updates preference and persists to Firebase', async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.settings.name).toBe('Test User');
    });

    act(() => {
      result.current.updatePreference('sidebarOpen', false);
    });

    expect(result.current.preferences.sidebarOpen).toBe(false);
    expect(mockSaveUserPreferences).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ sidebarOpen: false }),
    );
  });

  it('changes language and persists preference', async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.settings.name).toBe('Test User');
    });

    act(() => {
      result.current.changeLanguage('pl');
    });

    expect(result.current.preferences.language).toBe('pl');
  });

  describe('sharing preferences', () => {
    it('returns default sharing preferences when Firebase returns null', async () => {
      mockLoadSharingPreferences.mockResolvedValue(null);

      const { result } = renderHook(() => useSettings(), {
        wrapper: makeWrapper(),
      });

      await waitFor(() => {
        expect(result.current.settings.name).toBe('Test User');
      });

      expect(result.current.sharingPreferences).toEqual({
        shareCalendarActivities: false,
        shareDiary: false,
      });
    });

    it('loads sharing preferences from Firebase', async () => {
      mockLoadSharingPreferences.mockResolvedValue({
        shareCalendarActivities: true,
        shareDiary: true,
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: makeWrapper(),
      });

      await waitFor(() => {
        expect(result.current.sharingPreferences.shareCalendarActivities).toBe(
          true,
        );
      });

      expect(result.current.sharingPreferences.shareDiary).toBe(true);
    });

    it('merges partial sharing preferences with defaults', async () => {
      mockLoadSharingPreferences.mockResolvedValue({
        shareDiary: true,
      });

      const { result } = renderHook(() => useSettings(), {
        wrapper: makeWrapper(),
      });

      await waitFor(() => {
        expect(result.current.sharingPreferences.shareDiary).toBe(true);
      });

      // shareCalendarActivities should still use the default
      expect(result.current.sharingPreferences.shareCalendarActivities).toBe(
        false,
      );
    });

    it('updates sharing preference and persists to Firebase', async () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: makeWrapper(),
      });

      await waitFor(() => {
        expect(result.current.settings.name).toBe('Test User');
      });

      act(() => {
        result.current.updateSharingPreference('shareCalendarActivities', true);
      });

      expect(result.current.sharingPreferences.shareCalendarActivities).toBe(
        true,
      );
      expect(mockSaveSharingPreferences).toHaveBeenCalledWith('user-1', {
        shareCalendarActivities: true,
        shareDiary: false,
      });
    });

    it('falls back to defaults when all fetches fail', async () => {
      mockLoadUserSettings.mockRejectedValue(new Error('Network error'));
      mockLoadUserPreferences.mockRejectedValue(new Error('Network error'));
      mockLoadSharingPreferences.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSettings(), {
        wrapper: makeWrapper(),
      });

      await waitFor(() => {
        expect(result.current.settings.name).toBe('');
      });

      expect(result.current.sharingPreferences).toEqual({
        shareCalendarActivities: false,
        shareDiary: false,
      });
      expect(result.current.preferences.sidebarOpen).toBe(true);
    });
  });
});

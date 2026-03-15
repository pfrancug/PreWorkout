import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGet, mockSet, mockRef } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn().mockResolvedValue(undefined),
  mockRef: vi.fn((_db: unknown, path?: string) => ({ _path: path })),
}));

vi.mock('firebase/database', () => ({
  get: mockGet,
  ref: mockRef,
  set: mockSet,
}));

vi.mock('./db', () => ({ database: {} }));

import {
  loadUserPreferences,
  loadUserSettings,
  saveUserPreferences,
  saveUserSettings,
} from './settings';

const makeSnap = (exists: boolean, val?: unknown) => ({
  exists: () => exists,
  val: () => val,
});

describe('settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveUserSettings', () => {
    it('writes settings to the correct path', async () => {
      const settings = {
        name: 'John',
        age: '30',
        height: '175',
        sex: 'male' as const,
      };
      await saveUserSettings('uid-1', settings);

      expect(mockRef).toHaveBeenCalledWith({}, 'users/uid-1/settings');
      expect(mockSet).toHaveBeenCalledWith(
        { _path: 'users/uid-1/settings' },
        settings,
      );
    });
  });

  describe('loadUserSettings', () => {
    it('returns settings when they exist', async () => {
      const settings = { name: 'John', age: '30', height: '175', sex: 'male' };
      mockGet.mockResolvedValue(makeSnap(true, settings));
      const result = await loadUserSettings('uid-1');

      expect(result).toEqual(settings);
    });

    it('returns null when no settings exist', async () => {
      mockGet.mockResolvedValue(makeSnap(false));
      const result = await loadUserSettings('uid-1');

      expect(result).toBeNull();
    });
  });

  describe('saveUserPreferences', () => {
    it('writes preferences to the correct path', async () => {
      const prefs = {
        sidebarOpen: true,
        chatPanelOpen: false,
        language: 'en' as const,
        defaultCalendarView: 'month' as const,
        hideConnectionSection: false,
      };
      await saveUserPreferences('uid-1', prefs);

      expect(mockRef).toHaveBeenCalledWith({}, 'users/uid-1/preferences');
      expect(mockSet).toHaveBeenCalledWith(
        { _path: 'users/uid-1/preferences' },
        prefs,
      );
    });
  });

  describe('loadUserPreferences', () => {
    it('returns preferences when they exist', async () => {
      const prefs = { sidebarOpen: true, language: 'en' };
      mockGet.mockResolvedValue(makeSnap(true, prefs));
      const result = await loadUserPreferences('uid-1');

      expect(result).toEqual(prefs);
    });

    it('returns null when no preferences exist', async () => {
      mockGet.mockResolvedValue(makeSnap(false));
      const result = await loadUserPreferences('uid-1');

      expect(result).toBeNull();
    });
  });
});

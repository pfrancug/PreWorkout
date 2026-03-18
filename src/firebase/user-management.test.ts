import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGet, mockSet, mockRef, mockRemove, mockUpdate, mockQuery } =
  vi.hoisted(() => ({
    mockGet: vi.fn(),
    mockSet: vi.fn().mockResolvedValue(undefined),
    mockRef: vi.fn((_db: unknown, path?: string) => ({ _path: path })),
    mockRemove: vi.fn().mockResolvedValue(undefined),
    mockUpdate: vi.fn().mockResolvedValue(undefined),
    mockQuery: vi.fn((...args: unknown[]) => args),
  }));

vi.mock('firebase/database', () => ({
  get: mockGet,
  set: mockSet,
  ref: mockRef,
  remove: mockRemove,
  update: mockUpdate,
  query: mockQuery,
  orderByChild: vi.fn((field: string) => ({ _orderBy: field })),
  equalTo: vi.fn((val: string) => ({ _equalTo: val })),
}));

vi.mock('./db', () => ({ database: {} }));

const mockLoadUserSettings = vi.fn().mockResolvedValue(null);
const mockLoadUserPreferences = vi.fn().mockResolvedValue(null);
const mockLoadSharingPreferences = vi.fn().mockResolvedValue(null);
const mockLoadUserMessages = vi.fn().mockResolvedValue(null);
const mockLoadUserData = vi.fn().mockResolvedValue(null);
const mockLoadMessageLimitConfig = vi.fn().mockResolvedValue(null);
const mockLoadCalendarNotes = vi.fn().mockResolvedValue(null);
const mockLoadActivityCategories = vi.fn().mockResolvedValue(null);
const mockSaveUserSettings = vi.fn().mockResolvedValue(undefined);
const mockSaveUserPreferences = vi.fn().mockResolvedValue(undefined);
const mockSaveUserData = vi.fn().mockResolvedValue(undefined);
const mockSaveUserMessages = vi.fn().mockResolvedValue(undefined);
const mockSaveActivityCategories = vi.fn().mockResolvedValue(undefined);

vi.mock('./settings', () => ({
  getUserSettingsRef: (uid: string) => ({ _path: `users/${uid}/settings` }),
  getUserPreferencesRef: (uid: string) => ({
    _path: `users/${uid}/preferences`,
  }),
  getUserSharingPreferencesRef: (uid: string) => ({
    _path: `users/${uid}/sharingPreferences`,
  }),
  loadUserSettings: (...args: unknown[]) => mockLoadUserSettings(...args),
  loadUserPreferences: (...args: unknown[]) => mockLoadUserPreferences(...args),
  loadSharingPreferences: (...args: unknown[]) =>
    mockLoadSharingPreferences(...args),
  saveUserSettings: (...args: unknown[]) => mockSaveUserSettings(...args),
  saveUserPreferences: (...args: unknown[]) => mockSaveUserPreferences(...args),
}));

vi.mock('./diary', () => ({
  getUserDataRef: (uid: string) => ({ _path: `users/${uid}/data` }),
  loadUserData: (...args: unknown[]) => mockLoadUserData(...args),
  saveUserData: (...args: unknown[]) => mockSaveUserData(...args),
}));

vi.mock('./messages', () => ({
  getUserMessagesRef: (uid: string) => ({ _path: `users/${uid}/messages` }),
  loadUserMessages: (...args: unknown[]) => mockLoadUserMessages(...args),
  saveUserMessages: (...args: unknown[]) => mockSaveUserMessages(...args),
}));

vi.mock('./message-limits', () => ({
  getUserLimitsRef: (uid: string) => ({ _path: `users/${uid}/limits` }),
  loadMessageLimitConfig: (...args: unknown[]) =>
    mockLoadMessageLimitConfig(...args),
}));

vi.mock('./calendar', () => ({
  getUserCalendarEntriesRef: (uid: string) => ({
    _path: `users/${uid}/calendarEntries`,
  }),
  getUserCalendarNotesRef: (uid: string) => ({
    _path: `users/${uid}/calendarNotes`,
  }),
  loadCalendarNotes: (...args: unknown[]) => mockLoadCalendarNotes(...args),
}));

vi.mock('./activity-categories', () => ({
  getActivityCategoriesRef: (uid: string) => ({
    _path: `users/${uid}/activityCategories`,
  }),
  loadActivityCategories: (...args: unknown[]) =>
    mockLoadActivityCategories(...args),
  saveActivityCategories: (...args: unknown[]) =>
    mockSaveActivityCategories(...args),
}));

import {
  deleteAllUserData,
  importAllUserData,
  loadAllUserData,
} from './user-management';

const makeSnap = (exists: boolean, val?: unknown) => ({
  exists: () => exists,
  val: () => val,
  forEach: (cb: (child: { ref: unknown }) => void) => {
    if (exists && val && typeof val === 'object') {
      for (const child of Object.values(val as Record<string, unknown>)) {
        cb({ ref: child });
      }
    }
  },
});

describe('user-management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no trainer connections
    mockGet.mockResolvedValue(makeSnap(false));
  });

  describe('deleteAllUserData', () => {
    it('removes sharingPreferences along with other user data', async () => {
      await deleteAllUserData('uid-1');

      const removedPaths = mockRemove.mock.calls.map(
        (call: unknown[]) => (call[0] as { _path: string })._path,
      );

      expect(removedPaths).toContain('users/uid-1/settings');
      expect(removedPaths).toContain('users/uid-1/preferences');
      expect(removedPaths).toContain('users/uid-1/sharingPreferences');
      expect(removedPaths).toContain('users/uid-1/messages');
      expect(removedPaths).toContain('users/uid-1/data');
    });
  });

  describe('importAllUserData', () => {
    it('imports sharingPreferences when provided', async () => {
      const sharingPreferences = {
        shareCalendarActivities: true,
        shareDiary: false,
      };

      await importAllUserData('uid-1', {
        settings: null,
        preferences: null,
        sharingPreferences,
        messages: null,
        data: null,
        limits: null,
        calendarEntries: null,
        calendarNotes: null,
        activityCategories: null,
      });

      expect(mockSet).toHaveBeenCalledWith(
        { _path: 'users/uid-1/sharingPreferences' },
        sharingPreferences,
      );
    });

    it('does not import sharingPreferences when null', async () => {
      await importAllUserData('uid-1', {
        settings: null,
        preferences: null,
        sharingPreferences: null,
        messages: null,
        data: null,
        limits: null,
        calendarEntries: null,
        calendarNotes: null,
        activityCategories: null,
      });

      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe('loadAllUserData', () => {
    it('loads sharingPreferences', async () => {
      const sharingPrefs = {
        shareCalendarActivities: true,
        shareDiary: true,
      };
      mockLoadSharingPreferences.mockResolvedValue(sharingPrefs);
      mockGet.mockResolvedValue(makeSnap(false));

      const result = await loadAllUserData('uid-1');

      expect(mockLoadSharingPreferences).toHaveBeenCalledWith('uid-1');
      expect(result.sharingPreferences).toEqual(sharingPrefs);
    });

    it('returns null sharingPreferences when not set', async () => {
      mockLoadSharingPreferences.mockResolvedValue(null);
      mockGet.mockResolvedValue(makeSnap(false));

      const result = await loadAllUserData('uid-1');

      expect(result.sharingPreferences).toBeNull();
    });
  });
});

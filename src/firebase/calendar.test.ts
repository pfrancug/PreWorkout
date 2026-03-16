import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGet, mockSet, mockRef, mockRemove, mockUpdate, mockPush } =
  vi.hoisted(() => ({
    mockGet: vi.fn(),
    mockSet: vi.fn().mockResolvedValue(undefined),
    mockRef: vi.fn((_db: unknown, path?: string) => ({ _path: path })),
    mockRemove: vi.fn().mockResolvedValue(undefined),
    mockUpdate: vi.fn().mockResolvedValue(undefined),
    mockPush: vi.fn(() => ({ key: 'auto-id-1' })),
  }));

vi.mock('firebase/database', () => ({
  get: mockGet,
  ref: mockRef,
  set: mockSet,
  remove: mockRemove,
  update: mockUpdate,
  push: mockPush,
  onValue: vi.fn(() => vi.fn()),
}));

vi.mock('./db', () => ({ database: {} }));

import {
  createCalendarEntry,
  saveCalendarNote,
  updateCalendarEntryNote,
  updateCalendarEntryTime,
} from './calendar';

describe('calendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveCalendarNote', () => {
    it('saves trimmed note text', async () => {
      await saveCalendarNote('uid-1', '2025-03-15', '  my note  ');

      expect(mockSet).toHaveBeenCalledWith(
        { _path: 'users/uid-1/calendarNotes/2025-03-15' },
        'my note',
      );
    });

    it('removes note when text is empty', async () => {
      await saveCalendarNote('uid-1', '2025-03-15', '');

      expect(mockRemove).toHaveBeenCalled();
      expect(mockSet).not.toHaveBeenCalled();
    });

    it('removes note when text is only whitespace', async () => {
      await saveCalendarNote('uid-1', '2025-03-15', '   ');

      expect(mockRemove).toHaveBeenCalled();
      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe('createCalendarEntry', () => {
    it('creates entry with auto-generated id from push', async () => {
      const entryData = {
        type: 'activity' as const,
        activityId: 'yoga',
        time: null,
      };
      const result = await createCalendarEntry(
        'uid-1',
        '2025-03-15',
        entryData,
      );

      expect(result).toEqual({ ...entryData, id: 'auto-id-1' });
      expect(mockPush).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        { key: 'auto-id-1' },
        { ...entryData, id: 'auto-id-1' },
      );
    });

    it('uses correct path for the date', async () => {
      await createCalendarEntry('uid-1', '2025-03-15', {
        type: 'custom' as const,
        name: 'Meditation',
        time: '08:00',
      });

      expect(mockRef).toHaveBeenCalledWith(
        {},
        'users/uid-1/calendarEntries/2025-03-15',
      );
    });
  });

  describe('updateCalendarEntryNote', () => {
    it('saves trimmed note', async () => {
      await updateCalendarEntryNote(
        'uid-1',
        '2025-03-15',
        'e1',
        ' Great session ',
      );

      expect(mockSet).toHaveBeenCalledWith(
        { _path: 'users/uid-1/calendarEntries/2025-03-15/e1/note' },
        'Great session',
      );
    });

    it('removes note when empty', async () => {
      await updateCalendarEntryNote('uid-1', '2025-03-15', 'e1', '');

      expect(mockRemove).toHaveBeenCalled();
      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe('updateCalendarEntryTime', () => {
    it('updates time only when timeEnd is not provided', async () => {
      await updateCalendarEntryTime('uid-1', '2025-03-15', 'e1', '09:00');

      expect(mockUpdate).toHaveBeenCalledWith(
        { _path: 'users/uid-1/calendarEntries/2025-03-15/e1' },
        { time: '09:00' },
      );
    });

    it('updates both time and timeEnd when timeEnd is provided', async () => {
      await updateCalendarEntryTime(
        'uid-1',
        '2025-03-15',
        'e1',
        '09:00',
        '10:30',
      );

      expect(mockUpdate).toHaveBeenCalledWith(
        { _path: 'users/uid-1/calendarEntries/2025-03-15/e1' },
        { time: '09:00', timeEnd: '10:30' },
      );
    });

    it('clears timeEnd when passed as null', async () => {
      await updateCalendarEntryTime('uid-1', '2025-03-15', 'e1', null, null);

      expect(mockUpdate).toHaveBeenCalledWith(
        { _path: 'users/uid-1/calendarEntries/2025-03-15/e1' },
        { time: null, timeEnd: null },
      );
    });
  });
});

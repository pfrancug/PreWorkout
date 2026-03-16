import type { GetDrawerEntriesParams } from './types';
import type { ITrainingSession } from '@app-types/types';
import type {
  IActivityCategory,
  ICalendarEntries,
  ICalendarEntry,
} from '@firebase-config/database';

import { describe, expect, it } from 'vitest';

import { getDrawerEntries } from './calendarEventHelpers';

const trainerCategory: IActivityCategory = {
  id: 'trainer-cat-1',
  icon: 'dumbbell',
  name: 'Personal Training',
  color: 'blue',
};

const makeEntry = (
  overrides: Partial<ICalendarEntry> = {},
): ICalendarEntry => ({
  id: 'e1',
  type: 'activity',
  activityId: 'cat-1',
  time: null,
  ...overrides,
});

const makeSession = (
  overrides: Partial<ITrainingSession> = {},
): ITrainingSession => ({
  id: 's1',
  connectionId: 'conn-1',
  trainerId: 'trainer-1',
  traineeId: 'trainee-1',
  date: '2025-01-15',
  time: null,
  status: 'planned',
  trainerConfirmed: false,
  paymentStatus: 'unpaid',
  paidMarkedBy: null,
  createdAt: Date.now(),
  createdBy: 'trainer',
  ...overrides,
});

const baseParams: GetDrawerEntriesParams = {
  date: '2025-01-15',
  calendarEntries: null,
  trainerCalendar: null,
  trainerCategoryForDisplay: null,
  trainingSessions: [],
};

describe('getDrawerEntries', () => {
  it('returns empty array when date is null', () => {
    expect(getDrawerEntries({ ...baseParams, date: null })).toEqual([]);
  });

  it('returns empty array when no entries exist for the date', () => {
    expect(getDrawerEntries(baseParams)).toEqual([]);
  });

  it('returns entries from calendarEntries for the given date', () => {
    const entry = makeEntry();
    const calendarEntries: ICalendarEntries = {
      '2025-01-15': { e1: entry },
    };
    const result = getDrawerEntries({ ...baseParams, calendarEntries });

    expect(result).toEqual([entry]);
  });

  it('ignores entries from other dates', () => {
    const calendarEntries: ICalendarEntries = {
      '2025-01-16': { e1: makeEntry() },
    };
    const result = getDrawerEntries({ ...baseParams, calendarEntries });

    expect(result).toEqual([]);
  });

  describe('virtual trainer-day entry', () => {
    it('adds virtual trainer entry when trainerCalendar marks the date', () => {
      const result = getDrawerEntries({
        ...baseParams,
        trainerCalendar: { '2025-01-15': true },
        trainerCategoryForDisplay: trainerCategory,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'trainer-2025-01-15',
        type: 'activity',
        activityId: trainerCategory.id,
        time: null,
      });
    });

    it('skips virtual trainer entry when already logged as a real entry', () => {
      const loggedEntry = makeEntry({
        id: 'real-1',
        activityId: trainerCategory.id,
      });
      const calendarEntries: ICalendarEntries = {
        '2025-01-15': { 'real-1': loggedEntry },
      };
      const result = getDrawerEntries({
        ...baseParams,
        calendarEntries,
        trainerCalendar: { '2025-01-15': true },
        trainerCategoryForDisplay: trainerCategory,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('real-1');
    });

    it('skips virtual trainer entry when a timed training session exists', () => {
      const result = getDrawerEntries({
        ...baseParams,
        trainerCalendar: { '2025-01-15': true },
        trainerCategoryForDisplay: trainerCategory,
        trainingSessions: [makeSession({ time: '10:00' })],
      });

      // Should only contain the timed session virtual entry, not the trainer-day entry
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('session-s1');
    });

    it('includes note from matching untimed session on virtual trainer entry', () => {
      const result = getDrawerEntries({
        ...baseParams,
        trainerCalendar: { '2025-01-15': true },
        trainerCategoryForDisplay: trainerCategory,
        trainingSessions: [makeSession({ note: 'Leg day' })],
      });

      expect(result).toHaveLength(1);
      expect(result[0].note).toBe('Leg day');
    });

    it('does not add virtual trainer entry when trainerCategoryForDisplay is null', () => {
      const result = getDrawerEntries({
        ...baseParams,
        trainerCalendar: { '2025-01-15': true },
        trainerCategoryForDisplay: null,
      });

      expect(result).toEqual([]);
    });

    it('does not add virtual trainer entry when trainerCalendar is null', () => {
      const result = getDrawerEntries({
        ...baseParams,
        trainerCalendar: null,
        trainerCategoryForDisplay: trainerCategory,
      });

      expect(result).toEqual([]);
    });
  });

  describe('timed training session entries', () => {
    it('includes timed sessions as virtual entries', () => {
      const result = getDrawerEntries({
        ...baseParams,
        trainerCategoryForDisplay: trainerCategory,
        trainingSessions: [
          makeSession({ time: '09:00', timeEnd: '10:00', note: 'Cardio' }),
        ],
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'session-s1',
        type: 'activity',
        activityId: trainerCategory.id,
        time: '09:00',
        timeEnd: '10:00',
        note: 'Cardio',
      });
    });

    it('skips cancelled sessions', () => {
      const result = getDrawerEntries({
        ...baseParams,
        trainingSessions: [makeSession({ time: '09:00', status: 'cancelled' })],
      });

      expect(result).toEqual([]);
    });

    it('skips sessions without a time', () => {
      const result = getDrawerEntries({
        ...baseParams,
        trainingSessions: [makeSession({ time: null })],
      });

      expect(result).toEqual([]);
    });

    it('skips sessions from other dates', () => {
      const result = getDrawerEntries({
        ...baseParams,
        trainingSessions: [makeSession({ date: '2025-01-16', time: '09:00' })],
      });

      expect(result).toEqual([]);
    });

    it('uses "trainer" as fallback activityId when trainerCategoryForDisplay is null', () => {
      const result = getDrawerEntries({
        ...baseParams,
        trainerCategoryForDisplay: null,
        trainingSessions: [makeSession({ time: '09:00' })],
      });

      expect(result).toHaveLength(1);
      expect(result[0].activityId).toBe('trainer');
    });
  });

  describe('combined scenarios', () => {
    it('returns real entries plus timed session entries', () => {
      const entry = makeEntry({ id: 'e1', activityId: 'yoga' });
      const calendarEntries: ICalendarEntries = {
        '2025-01-15': { e1: entry },
      };
      const result = getDrawerEntries({
        ...baseParams,
        calendarEntries,
        trainerCategoryForDisplay: trainerCategory,
        trainingSessions: [makeSession({ time: '14:00' })],
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('e1');
      expect(result[1].id).toBe('session-s1');
    });

    it('returns real entries plus virtual trainer entry when no timed session', () => {
      const entry = makeEntry({ id: 'e1', activityId: 'yoga' });
      const calendarEntries: ICalendarEntries = {
        '2025-01-15': { e1: entry },
      };
      const result = getDrawerEntries({
        ...baseParams,
        calendarEntries,
        trainerCalendar: { '2025-01-15': true },
        trainerCategoryForDisplay: trainerCategory,
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('e1');
      expect(result[1].id).toBe('trainer-2025-01-15');
    });
  });
});

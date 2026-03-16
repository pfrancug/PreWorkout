import type { GetModalEntriesParams, GetModalSessionsParams } from './types';
import type { ITrainingSession } from '@app-types/types';
import type {
  ICalendarEntries,
  ICalendarEntry,
} from '@firebase-config/database';

import { describe, expect, it } from 'vitest';

import { getModalEntries, getModalSessions } from './calendarEventHelpers';

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

describe('getModalEntries', () => {
  const baseParams: GetModalEntriesParams = {
    date: '2025-01-15',
    calendarEntries: null,
  };

  it('returns empty array when date is null', () => {
    expect(getModalEntries({ ...baseParams, date: null })).toEqual([]);
  });

  it('returns empty array when no entries exist for the date', () => {
    expect(getModalEntries(baseParams)).toEqual([]);
  });

  it('returns entries from calendarEntries for the given date', () => {
    const entry = makeEntry();
    const calendarEntries: ICalendarEntries = {
      '2025-01-15': { e1: entry },
    };
    const result = getModalEntries({ ...baseParams, calendarEntries });

    expect(result).toEqual([entry]);
  });

  it('ignores entries from other dates', () => {
    const calendarEntries: ICalendarEntries = {
      '2025-01-16': { e1: makeEntry() },
    };
    const result = getModalEntries({ ...baseParams, calendarEntries });

    expect(result).toEqual([]);
  });
});

describe('getModalSessions', () => {
  const baseParams: GetModalSessionsParams = {
    date: '2025-01-15',
    trainingSessions: [],
  };

  it('returns empty array when date is null', () => {
    expect(getModalSessions({ ...baseParams, date: null })).toEqual([]);
  });

  it('returns empty array when no sessions exist', () => {
    expect(getModalSessions(baseParams)).toEqual([]);
  });

  it('returns non-cancelled sessions for the given date', () => {
    const session = makeSession({ id: 's1', date: '2025-01-15' });
    const result = getModalSessions({
      ...baseParams,
      trainingSessions: [session],
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s1');
  });

  it('filters out cancelled sessions', () => {
    const result = getModalSessions({
      ...baseParams,
      trainingSessions: [makeSession({ status: 'cancelled' })],
    });

    expect(result).toEqual([]);
  });

  it('filters out sessions from other dates', () => {
    const result = getModalSessions({
      ...baseParams,
      trainingSessions: [makeSession({ date: '2025-01-16' })],
    });

    expect(result).toEqual([]);
  });

  it('includes sessions with any non-cancelled status', () => {
    const result = getModalSessions({
      ...baseParams,
      trainingSessions: [
        makeSession({ id: 's1', status: 'planned' }),
        makeSession({ id: 's2', status: 'completed' }),
        makeSession({ id: 's3', status: 'cancelled' }),
      ],
    });

    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id)).toEqual(['s1', 's2']);
  });
});

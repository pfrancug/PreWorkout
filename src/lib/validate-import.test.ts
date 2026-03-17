import { validateImportData } from '@lib/validate-import';
import { describe, expect, it } from 'vitest';

const validSettings = {
  name: 'John',
  age: '30',
  height: '180',
  sex: 'male',
};

const validPreferences = {
  sidebarOpen: true,
  chatPanelOpen: false,
  language: 'en',
  defaultCalendarView: 'month',
};

const validMessage = {
  role: 'user',
  parts: [{ text: 'Hello' }],
};

const validDiaryRow = {
  id: 1,
  date: '2024-01-15',
  weight: 75,
  kcal: 2000,
  protein: 150,
  fat: 60,
  carbs: 200,
  completed: true,
};

const validCalendarEntries = {
  '2024-01-15': {
    abc123: { id: 'abc123', type: 'activity', activityId: 'running' },
  },
};

const validCalendarNotes = {
  '2024-01-15': 'Great day!',
};

const validActivityCategory = {
  id: 'cat1',
  icon: 'dumbbell',
  name: 'Gym',
  color: 'blue',
};

const validLimits = { mode: 'limited' };

const buildValid = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  settings: validSettings,
  preferences: validPreferences,
  messages: [validMessage],
  data: [validDiaryRow],
  limits: validLimits,
  calendarEntries: validCalendarEntries,
  calendarNotes: validCalendarNotes,
  activityCategories: [validActivityCategory],
  ...overrides,
});

describe('validateImportData', () => {
  describe('valid inputs', () => {
    it('accepts a complete valid object', () => {
      expect(validateImportData(buildValid())).toBe(true);
    });

    it('accepts an empty object (all keys optional)', () => {
      expect(validateImportData({})).toBe(true);
    });

    it('accepts null optional fields', () => {
      expect(
        validateImportData({
          settings: null,
          preferences: null,
          messages: null,
          data: null,
          limits: null,
          calendarEntries: null,
          calendarNotes: null,
          activityCategories: null,
        }),
      ).toBe(true);
    });

    it('accepts diary rows with null numeric fields', () => {
      expect(
        validateImportData(
          buildValid({
            data: [
              {
                id: 1,
                date: '2024-01-15',
                weight: null,
                kcal: null,
                protein: null,
                fat: null,
                carbs: null,
              },
            ],
          }),
        ),
      ).toBe(true);
    });

    it('accepts settings with avatarUrl', () => {
      expect(
        validateImportData(
          buildValid({
            settings: {
              ...validSettings,
              avatarUrl: 'data:image/jpeg;base64,',
            },
          }),
        ),
      ).toBe(true);
    });

    it('accepts settings with empty sex', () => {
      expect(
        validateImportData(
          buildValid({ settings: { ...validSettings, sex: '' } }),
        ),
      ).toBe(true);
    });

    it('accepts custom calendar entries', () => {
      expect(
        validateImportData(
          buildValid({
            calendarEntries: {
              '2024-01-15': {
                abc: { id: 'abc', type: 'custom', name: 'My Event' },
              },
            },
          }),
        ),
      ).toBe(true);
    });
  });

  describe('invalid top-level', () => {
    it('rejects null', () => {
      expect(validateImportData(null)).toBe(false);
    });

    it('rejects undefined', () => {
      expect(validateImportData(undefined)).toBe(false);
    });

    it('rejects a string', () => {
      expect(validateImportData('hello')).toBe(false);
    });

    it('rejects a number', () => {
      expect(validateImportData(42)).toBe(false);
    });

    it('rejects unknown top-level keys', () => {
      expect(validateImportData({ unknownKey: 'value' })).toBe(false);
    });
  });

  describe('invalid settings', () => {
    it('rejects non-object settings', () => {
      expect(validateImportData(buildValid({ settings: 'bad' }))).toBe(false);
    });

    it('rejects non-string name', () => {
      expect(
        validateImportData(
          buildValid({ settings: { ...validSettings, name: 123 } }),
        ),
      ).toBe(false);
    });

    it('rejects non-string age', () => {
      expect(
        validateImportData(
          buildValid({ settings: { ...validSettings, age: 30 } }),
        ),
      ).toBe(false);
    });

    it('rejects non-string height', () => {
      expect(
        validateImportData(
          buildValid({ settings: { ...validSettings, height: 180 } }),
        ),
      ).toBe(false);
    });

    it('rejects invalid sex enum', () => {
      expect(
        validateImportData(
          buildValid({ settings: { ...validSettings, sex: 'other' } }),
        ),
      ).toBe(false);
    });

    it('rejects non-string avatarUrl', () => {
      expect(
        validateImportData(
          buildValid({ settings: { ...validSettings, avatarUrl: 123 } }),
        ),
      ).toBe(false);
    });
  });

  describe('invalid preferences', () => {
    it('rejects non-object preferences', () => {
      expect(validateImportData(buildValid({ preferences: 42 }))).toBe(false);
    });

    it('rejects non-boolean sidebarOpen', () => {
      expect(
        validateImportData(
          buildValid({
            preferences: { ...validPreferences, sidebarOpen: 'yes' },
          }),
        ),
      ).toBe(false);
    });

    it('rejects non-boolean chatPanelOpen', () => {
      expect(
        validateImportData(
          buildValid({
            preferences: { ...validPreferences, chatPanelOpen: 1 },
          }),
        ),
      ).toBe(false);
    });

    it('rejects non-string language', () => {
      expect(
        validateImportData(
          buildValid({
            preferences: { ...validPreferences, language: true },
          }),
        ),
      ).toBe(false);
    });

    it('rejects invalid defaultCalendarView', () => {
      expect(
        validateImportData(
          buildValid({
            preferences: { ...validPreferences, defaultCalendarView: 'day' },
          }),
        ),
      ).toBe(false);
    });
  });

  describe('invalid messages', () => {
    it('rejects non-array messages', () => {
      expect(validateImportData(buildValid({ messages: 'bad' }))).toBe(false);
    });

    it('rejects message with invalid role', () => {
      expect(
        validateImportData(
          buildValid({
            messages: [{ role: 'admin', parts: [{ text: 'hi' }] }],
          }),
        ),
      ).toBe(false);
    });

    it('rejects message without parts array', () => {
      expect(
        validateImportData(
          buildValid({ messages: [{ role: 'user', parts: 'text' }] }),
        ),
      ).toBe(false);
    });

    it('rejects message with non-object part', () => {
      expect(
        validateImportData(
          buildValid({ messages: [{ role: 'user', parts: ['text'] }] }),
        ),
      ).toBe(false);
    });

    it('rejects message part without text', () => {
      expect(
        validateImportData(
          buildValid({
            messages: [{ role: 'user', parts: [{ value: 'hi' }] }],
          }),
        ),
      ).toBe(false);
    });

    it('rejects null message in array', () => {
      expect(validateImportData(buildValid({ messages: [null] }))).toBe(false);
    });
  });

  describe('invalid data (diary)', () => {
    it('rejects non-array data', () => {
      expect(validateImportData(buildValid({ data: {} }))).toBe(false);
    });

    it('rejects row without numeric id', () => {
      expect(
        validateImportData(
          buildValid({ data: [{ ...validDiaryRow, id: 'abc' }] }),
        ),
      ).toBe(false);
    });

    it('rejects row without string date', () => {
      expect(
        validateImportData(
          buildValid({ data: [{ ...validDiaryRow, date: 12345 }] }),
        ),
      ).toBe(false);
    });

    it('rejects row with string numeric field', () => {
      expect(
        validateImportData(
          buildValid({ data: [{ ...validDiaryRow, kcal: '2000' }] }),
        ),
      ).toBe(false);
    });

    it('rejects row with non-boolean completed', () => {
      expect(
        validateImportData(
          buildValid({ data: [{ ...validDiaryRow, completed: 'yes' }] }),
        ),
      ).toBe(false);
    });

    it('rejects null row in array', () => {
      expect(validateImportData(buildValid({ data: [null] }))).toBe(false);
    });
  });

  describe('invalid limits', () => {
    it('rejects non-object limits', () => {
      expect(validateImportData(buildValid({ limits: 5 }))).toBe(false);
    });

    it('rejects invalid mode value', () => {
      expect(
        validateImportData(buildValid({ limits: { mode: 'custom' } })),
      ).toBe(false);
    });

    it('rejects non-string mode', () => {
      expect(validateImportData(buildValid({ limits: { mode: 10 } }))).toBe(
        false,
      );
    });

    it('rejects old max format', () => {
      expect(validateImportData(buildValid({ limits: { max: 10 } }))).toBe(
        false,
      );
    });
  });

  describe('invalid calendarEntries', () => {
    it('rejects non-object calendarEntries', () => {
      expect(validateImportData(buildValid({ calendarEntries: 'bad' }))).toBe(
        false,
      );
    });

    it('rejects bad date key', () => {
      expect(
        validateImportData(
          buildValid({
            calendarEntries: {
              'not-a-date': { abc: { id: 'abc', type: 'activity' } },
            },
          }),
        ),
      ).toBe(false);
    });

    it('rejects entry with missing id', () => {
      expect(
        validateImportData(
          buildValid({
            calendarEntries: {
              '2024-01-15': { abc: { type: 'activity' } },
            },
          }),
        ),
      ).toBe(false);
    });

    it('rejects entry with invalid type', () => {
      expect(
        validateImportData(
          buildValid({
            calendarEntries: {
              '2024-01-15': { abc: { id: 'abc', type: 'event' } },
            },
          }),
        ),
      ).toBe(false);
    });

    it('rejects null entry value', () => {
      expect(
        validateImportData(
          buildValid({
            calendarEntries: { '2024-01-15': null },
          }),
        ),
      ).toBe(false);
    });
  });

  describe('invalid calendarNotes', () => {
    it('rejects non-object calendarNotes', () => {
      expect(validateImportData(buildValid({ calendarNotes: 'notes' }))).toBe(
        false,
      );
    });

    it('rejects bad date key', () => {
      expect(
        validateImportData(
          buildValid({ calendarNotes: { 'bad-date': 'note' } }),
        ),
      ).toBe(false);
    });

    it('rejects non-string note value', () => {
      expect(
        validateImportData(
          buildValid({ calendarNotes: { '2024-01-15': 123 } }),
        ),
      ).toBe(false);
    });
  });

  describe('invalid activityCategories', () => {
    it('rejects non-array activityCategories', () => {
      expect(validateImportData(buildValid({ activityCategories: {} }))).toBe(
        false,
      );
    });

    it('rejects category without id', () => {
      expect(
        validateImportData(
          buildValid({
            activityCategories: [{ icon: 'x', name: 'X', color: 'red' }],
          }),
        ),
      ).toBe(false);
    });

    it('rejects category without icon', () => {
      expect(
        validateImportData(
          buildValid({
            activityCategories: [{ id: '1', name: 'X', color: 'red' }],
          }),
        ),
      ).toBe(false);
    });

    it('rejects category without name', () => {
      expect(
        validateImportData(
          buildValid({
            activityCategories: [{ id: '1', icon: 'x', color: 'red' }],
          }),
        ),
      ).toBe(false);
    });

    it('rejects category without color', () => {
      expect(
        validateImportData(
          buildValid({
            activityCategories: [{ id: '1', icon: 'x', name: 'X' }],
          }),
        ),
      ).toBe(false);
    });

    it('rejects null category in array', () => {
      expect(
        validateImportData(buildValid({ activityCategories: [null] })),
      ).toBe(false);
    });
  });
});

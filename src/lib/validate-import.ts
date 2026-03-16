import type { IAllUserData } from '@firebase-config/database';

/**
 * Validates the shape of imported AllUserData.
 * Returns null if valid, or an error message describing the first problem found.
 */
export const validateImportData = (data: unknown): data is IAllUserData => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const d = data as Record<string, unknown>;

  // All top-level keys must be from the known set
  const knownKeys = new Set([
    'settings',
    'preferences',
    'messages',
    'data',
    'limits',
    'calendarEntries',
    'calendarNotes',
    'activityCategories',
  ]);

  for (const key of Object.keys(d)) {
    if (!knownKeys.has(key)) {
      return false;
    }
  }

  // Validate settings
  if (d.settings != null) {
    if (typeof d.settings !== 'object') {
      return false;
    }
    const s = d.settings as Record<string, unknown>;
    if (typeof s.name !== 'string') {
      return false;
    }
    if (typeof s.age !== 'string') {
      return false;
    }
    if (typeof s.height !== 'string') {
      return false;
    }
    if (typeof s.sex !== 'string') {
      return false;
    }
    if (!['male', 'female', ''].includes(s.sex as string)) {
      return false;
    }
    if (s.avatarUrl != null && typeof s.avatarUrl !== 'string') {
      return false;
    }
  }

  // Validate preferences
  if (d.preferences != null) {
    if (typeof d.preferences !== 'object') {
      return false;
    }
    const p = d.preferences as Record<string, unknown>;
    if (typeof p.sidebarOpen !== 'boolean') {
      return false;
    }
    if (typeof p.chatPanelOpen !== 'boolean') {
      return false;
    }
    if (typeof p.language !== 'string') {
      return false;
    }
    if (typeof p.defaultCalendarView !== 'string') {
      return false;
    }
    if (!['month', 'week'].includes(p.defaultCalendarView as string)) {
      return false;
    }
  }

  // Validate messages
  if (d.messages != null) {
    if (!Array.isArray(d.messages)) {
      return false;
    }
    for (const msg of d.messages) {
      if (!msg || typeof msg !== 'object') {
        return false;
      }
      if (typeof msg.role !== 'string') {
        return false;
      }
      if (!['user', 'model'].includes(msg.role)) {
        return false;
      }
      if (!Array.isArray(msg.parts)) {
        return false;
      }
      for (const part of msg.parts) {
        if (!part || typeof part !== 'object') {
          return false;
        }
        if (typeof part.text !== 'string') {
          return false;
        }
      }
    }
  }

  // Validate data (diary entries)
  if (d.data != null) {
    if (!Array.isArray(d.data)) {
      return false;
    }
    for (const row of d.data) {
      if (!row || typeof row !== 'object') {
        return false;
      }
      if (typeof row.id !== 'number') {
        return false;
      }
      if (typeof row.date !== 'string') {
        return false;
      }
      // Numeric fields can be null or number
      for (const field of ['weight', 'kcal', 'protein', 'fat', 'carbs']) {
        if (row[field] != null && typeof row[field] !== 'number') {
          return false;
        }
      }
      if (row.completed != null && typeof row.completed !== 'boolean') {
        return false;
      }
    }
  }

  // Validate limits
  if (d.limits != null) {
    if (typeof d.limits !== 'object') {
      return false;
    }
    const l = d.limits as Record<string, unknown>;
    if (
      typeof l.mode !== 'string' ||
      !['disabled', 'limited', 'unlimited'].includes(l.mode)
    ) {
      return false;
    }
  }

  // Validate calendarEntries
  if (d.calendarEntries != null) {
    if (typeof d.calendarEntries !== 'object') {
      return false;
    }
    for (const [date, entries] of Object.entries(
      d.calendarEntries as Record<string, unknown>,
    )) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
      }
      if (typeof entries !== 'object' || entries === null) {
        return false;
      }
      for (const entry of Object.values(entries as Record<string, unknown>)) {
        if (typeof entry !== 'object' || entry === null) {
          return false;
        }
        const e = entry as Record<string, unknown>;
        if (typeof e.id !== 'string') {
          return false;
        }
        if (e.type !== 'activity' && e.type !== 'custom') {
          return false;
        }
      }
    }
  }

  // Validate calendarNotes
  if (d.calendarNotes != null) {
    if (typeof d.calendarNotes !== 'object') {
      return false;
    }
    for (const [date, note] of Object.entries(
      d.calendarNotes as Record<string, unknown>,
    )) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
      }
      if (typeof note !== 'string') {
        return false;
      }
    }
  }

  // Validate activityCategories
  if (d.activityCategories != null) {
    if (!Array.isArray(d.activityCategories)) {
      return false;
    }
    for (const cat of d.activityCategories) {
      if (!cat || typeof cat !== 'object') {
        return false;
      }
      if (typeof cat.id !== 'string') {
        return false;
      }
      if (typeof cat.icon !== 'string') {
        return false;
      }
      if (typeof cat.name !== 'string') {
        return false;
      }
      if (typeof cat.color !== 'string') {
        return false;
      }
    }
  }

  return true;
};

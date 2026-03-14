import type { IRowData } from '../firebase/database';
import type { IRow } from '../types/types';

/**
 * Convert IRowData from Firebase to IRow.
 * Handles both legacy ISO strings and new YYYY-MM-DD format.
 */
export const fromFirebaseFormat = (data: IRowData[]): IRow[] =>
  data.map((row) => {
    let date: Date;

    if (row.date.includes('T')) {
      // Legacy ISO string — extract YYYY-MM-DD part and parse as local date
      const [y, m, d] = row.date.split('T')[0].split('-').map(Number);
      date = new Date(y, m - 1, d);
    } else {
      // New YYYY-MM-DD format — parse as local date
      const [y, m, d] = row.date.split('-').map(Number);
      date = new Date(y, m - 1, d);
    }

    return {
      ...row,
      date,
      completed: row.completed ?? false,
    };
  });

import type { IRow } from '@app-types/types';
import type { IRowData } from '@firebase-config/database';

import { HYPHEN } from '@constants/display';

/**
 * Convert IRowData from Firebase to IRow.
 * Handles both legacy ISO strings and new YYYY-MM-DD format.
 */
export const fromFirebaseFormat = (data: IRowData[]): IRow[] =>
  data.map((row) => {
    let date: Date;

    if (row.date.includes('T')) {
      // Legacy ISO string — extract YYYY-MM-DD part and parse as local date
      const [y, m, d] = row.date.split('T')[0].split(HYPHEN).map(Number);
      date = new Date(y, m - 1, d);
    } else {
      // New YYYY-MM-DD format — parse as local date
      const [y, m, d] = row.date.split(HYPHEN).map(Number);
      date = new Date(y, m - 1, d);
    }

    return {
      ...row,
      date,
      completed: row.completed ?? false,
    };
  });

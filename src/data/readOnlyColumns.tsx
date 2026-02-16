import type { IRow } from '../types/types';
import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';

import { Badge } from '@components/ui/badge';

/** Read-only columns for the trainee diary view (no select, no editable cells, no completed toggle) */
export const getReadOnlyColumns = (t: TFunction): ColumnDef<IRow>[] => [
  {
    accessorKey: 'date',
    header: t('table.date'),
    cell: ({ getValue }) => {
      const date = getValue() as Date;

      if (!date) {
        return '—';
      }

      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');

      return `${y}-${m}-${d}`;
    },
    size: 110,
    minSize: 100,
    maxSize: 130,
  },
  {
    accessorKey: 'weight',
    header: t('table.weight'),
    cell: ({ getValue }) => {
      const v = getValue() as number | null;

      return v != null ? v : '—';
    },
    size: 80,
    minSize: 70,
    maxSize: 100,
  },
  {
    accessorKey: 'kcal',
    header: t('table.calories'),
    cell: ({ getValue }) => {
      const v = getValue() as number | null;

      return v != null ? v : '—';
    },
    size: 90,
    minSize: 80,
    maxSize: 110,
  },
  {
    accessorKey: 'protein',
    header: t('table.protein'),
    cell: ({ getValue }) => {
      const v = getValue() as number | null;

      return v != null ? v : '—';
    },
    size: 80,
    minSize: 70,
    maxSize: 100,
  },
  {
    accessorKey: 'fat',
    header: t('table.fat'),
    cell: ({ getValue }) => {
      const v = getValue() as number | null;

      return v != null ? v : '—';
    },
    size: 70,
    minSize: 60,
    maxSize: 90,
  },
  {
    accessorKey: 'carbs',
    header: t('table.carbs'),
    cell: ({ getValue }) => {
      const v = getValue() as number | null;

      return v != null ? v : '—';
    },
    size: 70,
    minSize: 60,
    maxSize: 90,
  },
  {
    accessorKey: 'completed',
    header: t('table.completed'),
    cell: ({ getValue }) => {
      const completed = getValue() as boolean;

      return (
        <Badge variant={completed ? 'default' : 'secondary'}>
          {completed ? t('common.yes', 'Yes') : t('common.no', 'No')}
        </Badge>
      );
    },
    enableSorting: false,
    size: 80,
    minSize: 60,
    maxSize: 90,
  },
];

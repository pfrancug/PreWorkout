import type { IRow } from '../types/types';
import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';

import { EditableCell } from '@components/DataTable/EditableCell';
import { Checkbox } from '@components/ui/checkbox';

export const getColumns = (t: TFunction): ColumnDef<IRow>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        aria-label={t('table.selectAll')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={t('table.selectRow')}
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
    minSize: 40,
    maxSize: 40,
  },
  {
    accessorKey: 'date',
    header: t('table.date'),
    cell: EditableCell,
    size: 120,
    minSize: 120,
    maxSize: 120,
  },
  {
    accessorKey: 'weight',
    header: t('table.weight'),
    cell: EditableCell,
    size: 100,
    minSize: 100,
    maxSize: 100,
  },
  {
    accessorKey: 'kcal',
    header: t('table.calories'),
    cell: EditableCell,
    size: 90,
    minSize: 90,
    maxSize: 90,
  },
  {
    accessorKey: 'protein',
    header: t('table.protein'),
    cell: EditableCell,
    size: 100,
    minSize: 100,
    maxSize: 100,
  },
  {
    accessorKey: 'fat',
    header: t('table.fat'),
    cell: EditableCell,
    size: 80,
    minSize: 80,
    maxSize: 80,
  },
  {
    accessorKey: 'carbs',
    header: t('table.carbs'),
    cell: EditableCell,
    size: 90,
    minSize: 90,
    maxSize: 90,
  },
];

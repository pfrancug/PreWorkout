import type { IRow } from '@app-types/types';
import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';

import { EditableCell } from '@components/dataTable/EditableCell';
import { Checkbox } from '@components/ui/checkbox';
import { Switch } from '@components/ui/switch';

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
    size: 36,
    minSize: 36,
    maxSize: 36,
  },
  {
    accessorKey: 'date',
    header: t('table.date'),
    cell: EditableCell,
    size: 110,
    minSize: 100,
    maxSize: 130,
  },
  {
    accessorKey: 'weight',
    header: t('table.weight'),
    cell: EditableCell,
    size: 80,
    minSize: 70,
    maxSize: 100,
  },
  {
    accessorKey: 'kcal',
    header: t('table.calories'),
    cell: EditableCell,
    size: 90,
    minSize: 80,
    maxSize: 110,
  },
  {
    accessorKey: 'protein',
    header: t('table.protein'),
    cell: EditableCell,
    size: 80,
    minSize: 70,
    maxSize: 100,
  },
  {
    accessorKey: 'fat',
    header: t('table.fat'),
    cell: EditableCell,
    size: 70,
    minSize: 60,
    maxSize: 90,
  },
  {
    accessorKey: 'carbs',
    header: t('table.carbs'),
    cell: EditableCell,
    size: 70,
    minSize: 60,
    maxSize: 90,
  },
  {
    accessorKey: 'completed',
    header: t('table.completed'),
    cell: ({ row, table: tbl }) => {
      const meta = tbl.options.meta as {
        updateData: (
          rowIndex: number,
          columnId: string,
          value: unknown,
        ) => void;
      };

      return (
        <Switch
          checked={row.original.completed}
          size={'sm'}
          onCheckedChange={(checked) => {
            meta.updateData(row.index, 'completed', checked);
          }}
        />
      );
    },
    enableSorting: false,
    size: 60,
    minSize: 50,
    maxSize: 70,
  },
];

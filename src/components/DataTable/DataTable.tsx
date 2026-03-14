import type { IRow } from '../../types/types';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import type { Dispatch, SetStateAction } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DataTablePagination } from './DataTablePagination';
import { DataTableToolbar } from './DataTableToolbar';

interface Props {
  columns: ColumnDef<IRow>[];
  dataSet: IRow[] | null;
  setDataSet: Dispatch<SetStateAction<IRow[] | null>>;
}

const EMPTY_ARRAY: IRow[] = [];

export const DataTable = ({ columns, dataSet, setDataSet }: Props) => {
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'date', desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState({});
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    columnId: string;
  } | null>(null);

  const tableData = dataSet ?? EMPTY_ARRAY;

  const tableMeta = useMemo(() => {
    const editableColumns = [
      'date',
      'weight',
      'kcal',
      'protein',
      'fat',
      'carbs',
    ];

    return {
      editingCell,
      setEditingCell,
      editableColumns,
      updateData: (rowIndex: number, columnId: string, value: unknown) => {
        setDataSet((prev) => {
          if (!prev) {
            return prev;
          }

          return prev.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...row,
                [columnId]: value,
              };
            }

            return row;
          });
        });
      },
    };
  }, [editingCell, setDataSet]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 14,
      },
    },
    meta: tableMeta,
  });

  return (
    <div className={'space-y-4'}>
      <DataTableToolbar setDataSet={setDataSet} table={table} />

      <div className={'rounded-xl border'}>
        <Table className={'table-fixed'}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className={'border-0'}
                  data-state={row.getIsSelected() && 'selected'}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      className={'h-10 max-h-10 overflow-hidden'}
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className={'border-0'}>
                <TableCell
                  className={'h-24 text-center'}
                  colSpan={columns.length}
                >
                  <span className={'text-muted-foreground'}>
                    {t('table.noResults')}
                  </span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
};

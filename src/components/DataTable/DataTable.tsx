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
import { useState } from 'react';

import { DataTablePagination } from './DataTablePagination';
import { DataTableToolbar } from './DataTableToolbar';

interface Props {
  columns: ColumnDef<IRow>[];
  dataSet: IRow[] | null;
  setDataSet: Dispatch<SetStateAction<IRow[] | null>>;
}

export const DataTable = ({ columns, dataSet, setDataSet }: Props) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'date', desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState({});
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    columnId: string;
  } | null>(null);

  const editableColumns = ['date', 'weight', 'kcal', 'protein', 'fat', 'carbs'];

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table works correctly without React Compiler memoization
  const table = useReactTable({
    data: dataSet ?? [],
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
    meta: {
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
    },
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
                  data-state={row.getIsSelected() && 'selected'}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
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
              <TableRow>
                <TableCell
                  className={'h-24 text-center'}
                  colSpan={columns.length}
                >
                  {'No results.'}
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

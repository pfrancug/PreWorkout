import type { IRow } from '../../types/types';
import type { ColumnDef, SortingState } from '@tanstack/react-table';

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
import { useTranslation } from 'react-i18next';

import { DataTablePagination } from './DataTablePagination';

interface Props {
  columns: ColumnDef<IRow>[];
  data: IRow[] | null;
}

const EMPTY_ARRAY: IRow[] = [];

/** Read-only data table — no toolbar, no row selection, no editing */
export const ReadOnlyDataTable = ({ columns, data }: Props) => {
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'date', desc: true },
  ]);

  const tableData = data ?? EMPTY_ARRAY;

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table works correctly without React Compiler memoization
  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    initialState: {
      pagination: { pageSize: 14 },
    },
  });

  return (
    <div className={'space-y-4'}>
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
                <TableRow className={'border-0'} key={row.id}>
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

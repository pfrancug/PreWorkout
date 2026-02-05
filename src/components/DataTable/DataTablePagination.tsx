import type { Table } from '@tanstack/react-table';

import { Button } from '@components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface Props<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({ table }: Props<TData>) {
  return (
    <div className={'flex items-center justify-between px-2'}>
      <div className={'flex-1 text-sm text-muted-foreground'}>
        {table.getFilteredSelectedRowModel().rows.length}
        {' of'} {table.getFilteredRowModel().rows.length} {'row(s) selected.'}
      </div>

      <div className={'flex items-center space-x-6 lg:space-x-8'}>
        <div
          className={
            'flex w-[100px] items-center justify-center text-sm font-medium'
          }
        >
          {'Page '}
          {table.getState().pagination.pageIndex + 1}
          {' of'} {table.getPageCount()}
        </div>

        <div className={'flex items-center space-x-2'}>
          <Button
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.setPageIndex(0)}
            size={'icon-sm'}
            variant={'outline'}
          >
            <span className={'sr-only'}>{'Go to first page'}</span>

            <ChevronsLeft className={'size-4'} />
          </Button>

          <Button
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            size={'icon-sm'}
            variant={'outline'}
          >
            <span className={'sr-only'}>{'Go to previous page'}</span>

            <ChevronLeft className={'size-4'} />
          </Button>

          <Button
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            size={'icon-sm'}
            variant={'outline'}
          >
            <span className={'sr-only'}>{'Go to next page'}</span>

            <ChevronRight className={'size-4'} />
          </Button>

          <Button
            disabled={!table.getCanNextPage()}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            size={'icon-sm'}
            variant={'outline'}
          >
            <span className={'sr-only'}>{'Go to last page'}</span>

            <ChevronsRight className={'size-4'} />
          </Button>
        </div>
      </div>
    </div>
  );
}

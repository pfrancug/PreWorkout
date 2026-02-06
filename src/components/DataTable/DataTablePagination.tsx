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

export const DataTablePagination = <TData,>({ table }: Props<TData>) => {
  return (
    <div className={'flex items-center justify-end gap-2'}>
      <span className={'mr-auto text-xs text-muted-foreground'}>
        {'Page '}
        {table.getState().pagination.pageIndex + 1}
        {' of '}
        {table.getPageCount()}
      </span>

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
  );
};

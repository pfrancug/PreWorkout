import type { DataTablePaginationProps } from './types';

import { Button } from '@components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const DataTablePagination = <TData,>({
  table,
}: DataTablePaginationProps<TData>) => {
  const { t } = useTranslation();

  return (
    <div className={'flex items-center justify-end gap-2'}>
      <span className={'mr-auto text-xs text-muted-foreground'}>
        {t('table.page', {
          current: table.getState().pagination.pageIndex + 1,
          total: table.getPageCount(),
        })}
      </span>

      <Button
        disabled={!table.getCanPreviousPage()}
        onClick={() => table.setPageIndex(0)}
        size={'icon-sm'}
        variant={'outline'}
      >
        <span className={'sr-only'}>{t('table.goFirstPage')}</span>

        <ChevronsLeft className={'size-4'} />
      </Button>

      <Button
        disabled={!table.getCanPreviousPage()}
        onClick={() => table.previousPage()}
        size={'icon-sm'}
        variant={'outline'}
      >
        <span className={'sr-only'}>{t('table.goPreviousPage')}</span>

        <ChevronLeft className={'size-4'} />
      </Button>

      <Button
        disabled={!table.getCanNextPage()}
        onClick={() => table.nextPage()}
        size={'icon-sm'}
        variant={'outline'}
      >
        <span className={'sr-only'}>{t('table.goNextPage')}</span>

        <ChevronRight className={'size-4'} />
      </Button>

      <Button
        disabled={!table.getCanNextPage()}
        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
        size={'icon-sm'}
        variant={'outline'}
      >
        <span className={'sr-only'}>{t('table.goLastPage')}</span>

        <ChevronsRight className={'size-4'} />
      </Button>
    </div>
  );
};

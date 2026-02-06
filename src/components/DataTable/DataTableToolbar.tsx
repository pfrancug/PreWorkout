import type { IRow } from '../../types/types';
import type { Table } from '@tanstack/react-table';
import type { Dispatch, SetStateAction } from 'react';

import { Button } from '@components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@components/ui/tooltip';
import { Download, Plus, Trash2 } from 'lucide-react';

interface Props {
  table: Table<IRow>;
  setDataSet: Dispatch<SetStateAction<IRow[] | null>>;
}

export const DataTableToolbar = ({ table, setDataSet }: Props) => {
  const handleAddRow = () => {
    setDataSet((prev) => {
      const lastRow = prev?.[prev.length - 1];
      const newDate = lastRow?.date
        ? new Date(lastRow.date.getTime() + 86400000)
        : new Date();

      return [
        ...(prev ?? []),
        {
          id: (prev?.length ?? 0) + 1,
          date: newDate,
          weight: null,
          kcal: null,
          protein: null,
          fat: null,
          carbs: null,
        },
      ];
    });
  };

  const handleExport = () => {
    const rows = table.getFilteredRowModel().rows;
    const headers = ['date', 'weight', 'kcal', 'protein', 'fat', 'carbs'];
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => {
        const data = row.original;

        return [
          data.date?.toISOString().split('T')[0] ?? '',
          data.weight ?? '',
          data.kcal ?? '',
          data.protein ?? '',
          data.fat ?? '',
          data.carbs ?? '',
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'data.csv';
    link.click();
  };

  const handleDeleteSelected = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedIds = new Set(selectedRows.map((row) => row.original.id));

    setDataSet((prev) => prev?.filter((row) => !selectedIds.has(row.id)) ?? []);
    table.resetRowSelection();
  };

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className={'flex items-center justify-between'}>
      <div className={'flex items-center gap-2 text-xs text-muted-foreground'}>
        {selectedCount > 0 && (
          <span>
            {selectedCount}
            {' selected'}
          </span>
        )}
      </div>

      <div className={'flex items-center gap-1.5'}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className={'h-8 gap-1.5 text-xs'}
                onClick={handleAddRow}
                size={'sm'}
                variant={'outline'}
              >
                <Plus className={'size-3.5'} />
                {'Add'}
              </Button>
            </TooltipTrigger>

            <TooltipContent>{'Add new row'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className={'h-8 gap-1.5 text-xs'}
                onClick={handleExport}
                size={'sm'}
                variant={'outline'}
              >
                <Download className={'size-3.5'} />
                {'Export'}
              </Button>
            </TooltipTrigger>

            <TooltipContent>{'Export as CSV'}</TooltipContent>
          </Tooltip>

          {selectedCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleDeleteSelected}
                  size={'sm'}
                  variant={'outline'}
                  className={
                    'h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10'
                  }
                >
                  <Trash2 className={'size-3.5'} />
                  {'Delete'}
                  {` (${selectedCount})`}
                </Button>
              </TooltipTrigger>

              <TooltipContent>{'Delete selected rows'}</TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
};

import type { IRow } from '../../types/types';
import type { CellContext } from '@tanstack/react-table';
import type { KeyboardEvent } from 'react';

import { Calendar } from '@components/ui/calendar';
import { Input } from '@components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@components/ui/popover';
import { memo, useEffect, useRef, useState } from 'react';

interface TableMeta {
  updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
  editingCell?: { rowId: string; columnId: string } | null;
  setEditingCell?: (cell: { rowId: string; columnId: string } | null) => void;
  editableColumns?: string[];
}

interface EditableCellProps {
  getValue: () => unknown;
  row: CellContext<IRow, unknown>['row'];
  column: CellContext<IRow, unknown>['column'];
  table: CellContext<IRow, unknown>['table'];
}

export const EditableCell = memo(function EditableCell({
  getValue,
  row,
  column,
  table,
}: EditableCellProps) {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  const columnId = column.id as keyof IRow;
  const meta = table.options.meta as TableMeta | undefined;

  const isEditing =
    meta?.editingCell?.rowId === row.id &&
    meta?.editingCell?.columnId === columnId;

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const saveValue = () => {
    if (meta?.updateData) {
      let parsedValue: unknown = value;

      if (columnId === 'date' && typeof value === 'string') {
        parsedValue = value ? new Date(value) : null;
      } else if (
        ['weight', 'kcal', 'protein', 'fat', 'carbs'].includes(columnId)
      ) {
        parsedValue = value === '' || value === null ? null : Number(value);
      }

      meta.updateData(row.index, columnId, parsedValue);
    }
  };

  const stopEditing = () => {
    meta?.setEditingCell?.(null);
  };

  const onBlur = () => {
    saveValue();
    stopEditing();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveValue();
      stopEditing();
    }
    if (e.key === 'Escape') {
      setValue(initialValue);
      stopEditing();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      saveValue();

      const editableColumns = meta?.editableColumns ?? [];
      const currentColIndex = editableColumns.indexOf(columnId);
      const rows = table.getRowModel().rows;
      const currentRowPosition = rows.findIndex((r) => r.id === row.id);
      const totalRows = rows.length;

      let nextRowPosition = currentRowPosition;
      let nextColIndex = currentColIndex;

      if (e.shiftKey) {
        // Shift+Tab: go to previous column
        nextColIndex = currentColIndex - 1;
        if (nextColIndex < 0) {
          nextColIndex = editableColumns.length - 1;
          nextRowPosition = currentRowPosition - 1;
          if (nextRowPosition < 0) {
            nextRowPosition = totalRows - 1;
          }
        }
      } else {
        // Tab: go to next column
        nextColIndex = currentColIndex + 1;
        if (nextColIndex >= editableColumns.length) {
          nextColIndex = 0;
          nextRowPosition = currentRowPosition + 1;
          if (nextRowPosition >= totalRows) {
            nextRowPosition = 0;
          }
        }
      }

      const nextRow = rows[nextRowPosition];
      if (nextRow) {
        meta?.setEditingCell?.({
          rowId: nextRow.id,
          columnId: editableColumns[nextColIndex],
        });
      }
    }
  };

  const startEditing = () => {
    if (row.original.completed) {
      return;
    }
    meta?.setEditingCell?.({ rowId: row.id, columnId });
  };

  if (isEditing) {
    if (columnId === 'date') {
      const dateObj =
        value instanceof Date
          ? value
          : typeof value === 'string' && value
            ? new Date(value)
            : undefined;

      return (
        <Popover
          defaultOpen
          onOpenChange={(open) => {
            if (!open) {
              saveValue();
              stopEditing();
            }
          }}
        >
          <PopoverTrigger asChild>
            <div
              className={
                'flex h-6 cursor-pointer items-center rounded-sm border border-border/50 px-1 text-sm'
              }
            >
              {dateObj
                ? new Intl.DateTimeFormat(undefined, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  }).format(dateObj)
                : '-'}
            </div>
          </PopoverTrigger>

          <PopoverContent align={'start'} className={'w-auto p-0'}>
            <Calendar
              defaultMonth={dateObj}
              mode={'single'}
              selected={dateObj}
              onSelect={(day) => {
                if (day) {
                  setValue(day);
                  if (meta?.updateData) {
                    meta.updateData(row.index, columnId, day);
                  }
                  stopEditing();
                }
              }}
            />
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <Input
        onBlur={onBlur}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        ref={inputRef}
        type={'number'}
        value={value === null ? '' : String(value)}
        className={
          'h-6 w-full min-w-0 rounded-sm border-border/50 bg-transparent px-1 py-0 text-sm shadow-none focus-visible:ring-1'
        }
      />
    );
  }

  const displayValue = (() => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    if (columnId === 'date' && value instanceof Date) {
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(value);
    }
    if (columnId === 'weight' && typeof value === 'number') {
      return value.toFixed(1);
    }

    return String(value);
  })();

  return (
    <div
      onClick={startEditing}
      className={
        row.original.completed
          ? 'flex h-6 items-center px-1 text-muted-foreground'
          : 'flex h-6 cursor-pointer items-center rounded px-1 hover:bg-muted'
      }
    >
      {displayValue}
    </div>
  );
});

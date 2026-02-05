import type { IRow } from '../../types/types';
import type { CellContext } from '@tanstack/react-table';

import { Input } from '@components/ui/input';
import { useEffect, useRef, useState } from 'react';

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

export const EditableCell = ({
  getValue,
  row,
  column,
  table,
}: EditableCellProps) => {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
    meta?.setEditingCell?.({ rowId: row.id, columnId });
  };

  if (isEditing) {
    if (columnId === 'date') {
      const dateValue =
        value instanceof Date
          ? value.toISOString().split('T')[0]
          : typeof value === 'string'
            ? value
            : '';

      return (
        <Input
          className={'h-6 w-full min-w-0 px-1 py-0 text-sm'}
          onBlur={onBlur}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          ref={inputRef}
          type={'date'}
          value={dateValue}
        />
      );
    }

    return (
      <Input
        className={'h-6 w-full min-w-0 px-1 py-0 text-sm'}
        onBlur={onBlur}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        ref={inputRef}
        type={'number'}
        value={value === null ? '' : String(value)}
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
        'flex h-6 cursor-pointer items-center rounded px-1 hover:bg-muted'
      }
    >
      {displayValue}
    </div>
  );
};

import type { EditableCellProps, TableMeta } from './types';
import type { IRow } from '@app-types/types';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EditableCell } from './EditableCell';

const baseRow: IRow = {
  id: 1,
  date: new Date('2025-03-15'),
  kcal: 2000,
  protein: 150,
  carbs: 200,
  fat: 80,
  weight: 75.5,
  completed: false,
};

const makeProps = (
  overrides: Partial<{
    value: unknown;
    columnId: string;
    isEditing: boolean;
    completed: boolean;
    updateData: (...args: unknown[]) => void;
  }> = {},
): EditableCellProps => {
  const columnId = overrides.columnId ?? 'kcal';
  const rowId = '0';
  const updateData = overrides.updateData ?? vi.fn();
  const setEditingCell = vi.fn();

  const editingCell =
    overrides.isEditing !== false
      ? overrides.isEditing
        ? { rowId, columnId }
        : null
      : null;

  const meta: TableMeta = {
    updateData,
    editingCell,
    setEditingCell,
    editableColumns: ['date', 'kcal', 'protein', 'fat', 'carbs', 'weight'],
  };

  return {
    getValue: () =>
      'value' in overrides ? overrides.value : baseRow[columnId as keyof IRow],
    row: {
      id: rowId,
      index: 0,
      original: { ...baseRow, completed: overrides.completed ?? false },
    } as EditableCellProps['row'],
    column: { id: columnId } as EditableCellProps['column'],
    table: {
      options: { meta },
      getRowModel: () => ({
        rows: [{ id: rowId }],
      }),
    } as unknown as EditableCellProps['table'],
  };
};

describe('EditableCell', () => {
  describe('display mode', () => {
    it('renders the numeric value', () => {
      render(<EditableCell {...makeProps({ value: 2000 })} />);

      expect(screen.getByText('2000')).toBeInTheDocument();
    });

    it('renders EM_DASH for null values', () => {
      render(<EditableCell {...makeProps({ value: null })} />);

      expect(screen.getByText('\u2014')).toBeInTheDocument();
    });

    it('formats weight with one decimal', () => {
      render(
        <EditableCell {...makeProps({ value: 75.5, columnId: 'weight' })} />,
      );

      expect(screen.getByText('75.5')).toBeInTheDocument();
    });

    it('renders a cursor-pointer class for non-completed rows', () => {
      const { container } = render(
        <EditableCell {...makeProps({ completed: false })} />,
      );
      const cell = container.firstElementChild;

      expect(cell).toHaveClass('cursor-pointer');
    });

    it('renders without cursor-pointer for completed rows', () => {
      const { container } = render(
        <EditableCell {...makeProps({ completed: true })} />,
      );
      const cell = container.firstElementChild;

      expect(cell).not.toHaveClass('cursor-pointer');
      expect(cell).toHaveClass('text-muted-foreground');
    });
  });

  describe('edit mode', () => {
    it('renders an input when editing', () => {
      render(<EditableCell {...makeProps({ isEditing: true })} />);

      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('saves value on Enter key', async () => {
      const user = userEvent.setup();
      const updateData = vi.fn();
      render(
        <EditableCell
          {...makeProps({ isEditing: true, value: 2000, updateData })}
        />,
      );

      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '2500');
      await user.keyboard('{Enter}');

      expect(updateData).toHaveBeenCalledWith(0, 'kcal', 2500);
    });

    it('reverts value on Escape key', async () => {
      const user = userEvent.setup();
      const updateData = vi.fn();
      render(
        <EditableCell
          {...makeProps({ isEditing: true, value: 2000, updateData })}
        />,
      );

      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '9999');
      await user.keyboard('{Escape}');

      // Escape should NOT call updateData
      expect(updateData).not.toHaveBeenCalled();
    });

    it('saves empty value as null for numeric columns', async () => {
      const user = userEvent.setup();
      const updateData = vi.fn();
      render(
        <EditableCell
          {...makeProps({ isEditing: true, value: 2000, updateData })}
        />,
      );

      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.keyboard('{Enter}');

      expect(updateData).toHaveBeenCalledWith(0, 'kcal', null);
    });
  });
});

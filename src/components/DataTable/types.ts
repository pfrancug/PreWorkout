import type { IRow } from '@app-types/types';
import type { CellContext, ColumnDef, Table } from '@tanstack/react-table';
import type { Dispatch, SetStateAction } from 'react';

export interface DataTableProps {
  columns: ColumnDef<IRow>[];
  dataSet: IRow[] | null;
  setDataSet: Dispatch<SetStateAction<IRow[] | null>>;
}

export interface DataTableToolbarProps {
  table: Table<IRow>;
  setDataSet: Dispatch<SetStateAction<IRow[] | null>>;
}

export interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export interface TableMeta {
  updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
  editingCell?: { rowId: string; columnId: string } | null;
  setEditingCell?: (cell: { rowId: string; columnId: string } | null) => void;
  editableColumns?: string[];
}

export interface EditableCellProps {
  getValue: () => unknown;
  row: CellContext<IRow, unknown>['row'];
  column: CellContext<IRow, unknown>['column'];
  table: CellContext<IRow, unknown>['table'];
}

export interface ReadOnlyDataTableProps {
  columns: ColumnDef<IRow>[];
  data: IRow[] | null;
}

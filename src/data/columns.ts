import type { IRow } from '../types/types';
import type { GridColDef } from '@mui/x-data-grid';

export const columns: GridColDef<IRow>[] = [
  {
    field: 'date',
    headerName: 'Date',
    type: 'date',
    editable: true,
    sortable: true,
    width: 100,
  },
  {
    field: 'weight',
    headerName: 'Weight (kg)',
    type: 'number',
    editable: true,
    sortable: false,
    valueFormatter: (value) => (value ? value : '-'),
    width: 100,
  },
  {
    field: 'kcal',
    headerName: 'Calories',
    type: 'number',
    editable: true,
    sortable: false,
    valueFormatter: (value) => (value ? value : '-'),
    width: 100,
  },
  {
    field: 'protein',
    headerName: 'Protein (g)',
    type: 'number',
    editable: true,
    sortable: false,
    valueFormatter: (value) => (value ? value : '-'),
    width: 100,
  },
  {
    field: 'fat',
    headerName: 'Fat (g)',
    type: 'number',
    editable: true,
    sortable: false,
    valueFormatter: (value) => (value ? value : '-'),
    width: 100,
  },
  {
    field: 'carbs',
    headerName: 'Carbs (g)',
    type: 'number',
    editable: true,
    sortable: false,
    valueFormatter: (value) => (value ? value : '-'),
    width: 100,
  },
];

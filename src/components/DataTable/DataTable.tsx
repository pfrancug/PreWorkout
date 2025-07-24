import type { IRow } from '../../types/types';
import type { Dispatch, SetStateAction } from 'react';

import { DataGrid } from '@mui/x-data-grid';

import { columns } from '../../data/columns';
import { CustomToolbar } from './CustomToolbar';

interface Props {
  dataSet: IRow[] | null;
  setDataSet: Dispatch<SetStateAction<IRow[] | null>>;
}

export const DataTable = ({ dataSet, setDataSet }: Props) => {
  const onRowChange = (newRow: IRow) => {
    const updatedRows = dataSet?.map((oldRow) => {
      if (oldRow.id === newRow.id) {
        return newRow;
      }

      return oldRow;
    });

    setDataSet(updatedRows ?? null);
    return newRow;
  };

  return (
    <DataGrid
      checkboxSelection
      disableColumnFilter
      disableColumnMenu
      disableColumnResize
      showToolbar
      columns={columns}
      density={'compact'}
      editMode={'row'}
      pageSizeOptions={[14]}
      processRowUpdate={onRowChange}
      rows={dataSet ?? undefined}
      initialState={{
        pagination: { paginationModel: { pageSize: 14 } },
        sorting: { sortModel: [{ field: 'date', sort: 'desc' }] },
      }}
      slots={{
        toolbar: () => <CustomToolbar setDataSet={setDataSet} />,
      }}
      sx={{
        borderRadius: 4,
        borderWidth: 1,
        borderColor: (theme) => theme.palette.divider,
      }}
    />
  );
};

import type { IRow } from '../../types/types';
import type { Dispatch, SetStateAction } from 'react';

import { Add, DeleteSweep, Download } from '@mui/icons-material';
import { Divider, IconButton, Stack, Tooltip } from '@mui/material';
import { Toolbar, ToolbarButton, useGridApiContext } from '@mui/x-data-grid';

interface Props {
  setDataSet: Dispatch<SetStateAction<IRow[] | null>>;
}

export const CustomToolbar = ({ setDataSet }: Props) => {
  const apiRef = useGridApiContext();

  return (
    <Toolbar>
      <Stack
        alignItems={'center'}
        sx={{
          alignItems: 'center',
          flexDirection: 'row',
          gap: 1,
          justifyContent: 'flex-end',
          px: 0.25,
          width: '100%',
        }}
      >
        <Tooltip title={'Add new row'}>
          <ToolbarButton
            render={<IconButton size={'small'} />}
            onClick={() =>
              setDataSet((prev) =>
                [...(prev ?? [])].concat({
                  id: (prev ?? []).length + 1,
                  date: (prev ?? [])[(prev ?? []).length - 1]?.date
                    ? new Date(
                        (prev ?? [])[(prev ?? []).length - 1].date.getTime() +
                          86400000
                      )
                    : new Date(),
                  weight: 0,
                  kcal: 0,
                  protein: 0,
                  fat: 0,
                  carbs: 0,
                })
              )
            }
          >
            <Add fontSize={'small'} />
          </ToolbarButton>
        </Tooltip>

        <Divider orientation={'vertical'} sx={{ height: 20 }} />

        <Tooltip title={'Export data as CSV'}>
          <ToolbarButton
            onClick={() => apiRef.current.exportDataAsCsv({ fileName: 'data' })}
            render={<IconButton size={'small'} />}
          >
            <Download fontSize={'small'} />
          </ToolbarButton>
        </Tooltip>

        <Divider orientation={'vertical'} sx={{ height: 20 }} />

        <Tooltip title={'Remove selected rows'}>
          <ToolbarButton
            render={<IconButton size={'small'} />}
            onClick={() => {
              const selectedRows = apiRef.current.getSelectedRows();

              selectedRows.forEach((row) => {
                setDataSet(
                  (prev) => prev?.filter((r) => r.id !== row.id) ?? []
                );
              });
            }}
          >
            <DeleteSweep fontSize={'small'} />
          </ToolbarButton>
        </Tooltip>
      </Stack>
    </Toolbar>
  );
};

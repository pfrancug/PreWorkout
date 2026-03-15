import type { IRow } from '@app-types/types';

import { createContext, type Dispatch, type SetStateAction } from 'react';

interface DataContextType {
  dataSet: IRow[] | null;
  setDataSet: Dispatch<SetStateAction<IRow[] | null>>;
  isLoading: boolean;
}

export const DataContext = createContext<DataContextType | null>(null);

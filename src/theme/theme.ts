import { createTheme } from '@mui/material';

import { createPalette } from './createPalette';

const palette = createPalette();

export const theme = createTheme({
  cssVariables: true,

  palette,
});

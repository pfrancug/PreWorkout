import type { PaletteOptions } from '@mui/material';

import { alpha } from '@mui/material';

import { BRAND, GRAY, GREEN, ORANGE, RED } from './colors';

export const createPalette = (): PaletteOptions => ({
  mode: 'dark',

  primary: {
    contrastText: BRAND[50],
    light: BRAND[300],
    main: BRAND[400],
    dark: BRAND[700],
  },
  info: {
    contrastText: BRAND[300],
    light: BRAND[500],
    main: BRAND[700],
    dark: BRAND[900],
  },
  warning: {
    light: ORANGE[400],
    main: ORANGE[500],
    dark: ORANGE[700],
  },
  error: {
    light: RED[400],
    main: RED[500],
    dark: RED[700],
  },
  success: {
    light: GREEN[400],
    main: GREEN[500],
    dark: GREEN[700],
  },
  grey: {
    ...GRAY,
  },
  divider: alpha(GRAY[700], 0.6),
  background: {
    default: GRAY[900],
    paper: 'hsl(220, 30%, 7%)',
  },
  text: {
    primary: 'hsl(0, 0%, 100%)',
    secondary: GRAY[400],
  },
  action: {
    hover: alpha(GRAY[600], 0.2),
    selected: alpha(GRAY[600], 0.3),
  },
});

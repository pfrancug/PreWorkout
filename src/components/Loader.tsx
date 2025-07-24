import { CircularProgress, Stack, useTheme } from '@mui/material';

export const Loader = () => {
  const theme = useTheme();

  return (
    <Stack
      sx={{
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg height={0} width={0}>
        <defs>
          <linearGradient
            id={'loader_gradient'}
            x1={'0%'}
            x2={'0%'}
            y1={'0%'}
            y2={'100%'}
          >
            <stop offset={'0%'} stopColor={theme.palette.secondary.dark} />
            <stop offset={'100%'} stopColor={theme.palette.primary.light} />
          </linearGradient>
        </defs>
      </svg>

      <CircularProgress
        sx={{ 'svg circle': { stroke: 'url(#loader_gradient)' } }}
      />
    </Stack>
  );
};

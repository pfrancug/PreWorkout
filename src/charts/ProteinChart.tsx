import type { IRow } from '../types/types';

import {
  Card,
  CardContent,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { SparkLineChart, areaElementClasses } from '@mui/x-charts';

import { dateFormatter } from '../utils/dateFormatter';

interface Props {
  data: IRow[] | null;
  days?: number;
}

export const ProteinChart = ({ data, days = 14 }: Props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  function AreaGradient({ color, id }: { color: string; id: string }) {
    const maxOffset = () => {
      if (!data || data.length === 0) {
        return '100%';
      }

      const minWeight =
        Math.min(
          ...data
            .slice(data.length - days - 1, data.length - 1)
            .map((row) => row.protein ?? 95)
        ) - 1;

      const maxWeight =
        Math.max(
          ...data
            .slice(data.length - days - 1, data.length - 1)
            .map((row) => row.protein ?? 95)
        ) + 1;

      return `${((maxWeight - minWeight) / maxWeight) * 100}%`;
    };

    return (
      <defs>
        <linearGradient id={id} x1={'50%'} x2={'50%'} y1={'0%'} y2={'100%'}>
          <stop offset={'0%'} stopColor={color} stopOpacity={0.3} />
          <stop offset={maxOffset()} stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
    );
  }

  return (
    <Card
      variant={'outlined'}
      sx={{
        bgcolor: theme.palette.background.default,
        borderRadius: isMobile ? 2 : 4,
        height: isMobile ? 150 : 190,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <CardContent
        sx={{
          'display': 'flex',
          'flexDirection': 'column',
          'height': '100%',
          'justifyContent': 'space-between',
          'p': isMobile ? 1 : 2,

          '&:last-child': {
            pb: isMobile ? 0.75 : 1.75,
          },
        }}
      >
        <Typography gutterBottom={!isMobile} variant={'subtitle2'}>
          {'Protein'}
        </Typography>

        <Stack sx={{ gap: isMobile ? 1 : 2 }}>
          <Stack>
            <Stack
              sx={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                gap: 0.5,
              }}
            >
              <Typography variant={isMobile ? 'h5' : 'h4'}>
                {(() => {
                  if (!data) {
                    return '0';
                  }

                  const last14Days = data.slice(-14);

                  const validProteins = last14Days.filter(
                    (row) => row.protein !== null
                  );

                  const sum = validProteins.reduce(
                    (acc, row) => acc + row.protein!,
                    0
                  );

                  return validProteins.length > 0
                    ? (sum / validProteins.length).toFixed(0)
                    : 0;
                })()}
              </Typography>

              <Typography color={'textSecondary'} variant={'subtitle1'}>
                {'g'}
              </Typography>
            </Stack>

            <Typography color={'textSecondary'} variant={'caption'}>
              {'Average over last ' + days + ' days'}
            </Typography>
          </Stack>

          <Stack
            sx={{
              height: 50,
              width: '100%',
            }}
          >
            {data ? (
              <SparkLineChart
                area
                showHighlight
                showTooltip
                color={theme.palette.success.light}
                margin={{ left: -24, right: -24, top: 0, bottom: 0 }}
                data={data
                  .map((row) => row.protein ?? 0)
                  .slice(data.length - days - 1, data.length - 1)}
                sx={{
                  [`& .${areaElementClasses.root}`]: {
                    fill: `url(#area-gradient-${30})`,
                  },
                }}
                xAxis={{
                  scaleType: 'band',
                  data: data
                    .map((row) => row.date)
                    .slice(data.length - days - 1, data.length - 1),
                  valueFormatter: (value: Date) => dateFormatter.format(value),
                }}
                yAxis={{
                  min:
                    Math.min(
                      ...data
                        .slice(data.length - days - 1, data.length - 1)
                        .map((row) => row.protein ?? 100)
                    ) - 50,
                  max:
                    Math.max(
                      ...data
                        .slice(data.length - days - 1, data.length - 1)
                        .map((row) => row.protein ?? 100)
                    ) + 50,
                }}
              >
                <AreaGradient
                  color={theme.palette.success.light}
                  id={`area-gradient-${30}`}
                />
              </SparkLineChart>
            ) : null}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );

  // return (
  //   <BarChart
  //     borderRadius={4}
  //     colors={[theme.palette.success.light]}
  //     grid={{ horizontal: true }}
  //     height={220}
  //     strokeWidth={0}
  //     width={660}
  //     series={[
  //       {
  //         label: 'Protein (g)',
  //         data: data
  //           .map((row) => row.protein)
  //           .slice(data.length - days, data.length),
  //       },
  //     ]}
  //     xAxis={[
  //       {
  //         data: data
  //           .map((row) => row.date)
  //           .slice(data.length - days, data.length),
  //         scaleType: 'band',
  //         valueFormatter: (value: Date) => dateFormatter.format(value),
  //       },
  //     ]}
  //   />
  // );
};

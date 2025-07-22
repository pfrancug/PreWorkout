import type { IRow } from '../types/types';

import { TrendingDown, TrendingUp } from '@mui/icons-material';
import {
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { SparkLineChart, areaElementClasses } from '@mui/x-charts';
import { useMemo } from 'react';

import { dateFormatter } from '../utils/dateFormatter';

interface Props {
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  data: IRow[] | null;
  days?: number;
  value: 'kcal' | 'protein' | 'weight' | 'fat' | 'carbs';
}

export const SparkChart = ({ color, data, days = 14, value }: Props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // This function slices the data to only include the last 'days' entries.
  const slicedData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    return data.slice(data.length - days - 1, data.length - 1);
  }, [data, days]);

  // This function calculates the minimum value for the chart's y-axis.
  const minValue = useMemo(() => {
    if (slicedData.length === 0) {
      return 0;
    }

    const validValues = slicedData.reduce((acc: number[], row) => {
      if (row[value] !== null) {
        acc.push(row[value]);
      }
      return acc;
    }, []);

    return validValues.length > 0 ? Math.min(...validValues) : 0;
  }, [slicedData, value]);

  //  This function calculates the maximum value for the chart's y-axis.
  const maxValue = useMemo(() => {
    if (slicedData.length === 0) {
      return 0;
    }

    const validValues = slicedData.reduce((acc: number[], row) => {
      if (row[value] !== null) {
        acc.push(row[value]);
      }
      return acc;
    }, []);

    return validValues.length > 0 ? Math.max(...validValues) : 0;
  }, [slicedData, value]);

  //   This function calculates the maximum offset for the gradient based on the min and max values.
  const maxOffset = useMemo(() => {
    const calculate = ((maxValue - minValue) / maxValue) * 100;

    return `${slicedData.length === 0 ? 100 : calculate}%`;
  }, [maxValue, minValue, slicedData.length]);

  // This function calculates the average value for the chart's y-axis.
  const averageValue = useMemo(() => {
    if (!data) {
      return '0.0';
    }

    const validWeights = slicedData.filter((row) => row[value] !== null);

    const sum = validWeights.reduce((acc, row) => acc + (row[value] ?? 0), 0);

    return validWeights.length > 0 ? (sum / validWeights.length).toFixed(1) : 0;
  }, [data, slicedData, value]);

  // This function calculates the weight range for the chart's y-axis.
  const weightRange = useMemo(() => {
    if (slicedData.length === 0) {
      return '0.0 - 0.0';
    }

    const validWeights = slicedData
      .map((row) => row[value])
      .filter((val) => val !== null);

    const first = validWeights[0];
    const lest = validWeights[validWeights.length - 1];

    return `${first.toFixed(1)} - ${lest.toFixed(1)}`;
  }, [slicedData, value]);

  const text = useMemo(() => {
    switch (value) {
      case 'carbs':
        return { title: 'Carbs', unit: 'g' };
      case 'fat':
        return { title: 'Fat', unit: 'g' };
      case 'kcal':
        return { title: 'Calories', unit: 'kcal' };
      case 'protein':
        return { title: 'Protein', unit: 'g' };
      case 'weight':
        return { title: 'Weight', unit: 'kg' };
      default:
        return { title: 'Unknown', unit: '' };
    }
  }, [value]);

  // This function calculates the weight difference between the first and last valid values.
  const weightDifference = useMemo(() => {
    if (slicedData.length === 0) {
      return 0;
    }

    const firstValidValue = slicedData.find((row) => row[value] !== null)?.[
      value
    ];

    const lastValidValue = slicedData
      .reverse()
      .find((row) => row[value] !== null)?.[value];

    const difference =
      firstValidValue && lastValidValue
        ? lastValidValue - firstValidValue
        : null;

    return difference;
  }, [slicedData, value]);

  return (
    <Card
      variant={'outlined'}
      sx={{
        bgcolor: (theme) => theme.palette.background.default,
        borderRadius: 4,
        height: isMobile ? 170 : 190,
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
          'px': isMobile ? 1.5 : 2,
          'py': isMobile ? 1 : 1.5,

          '&:last-child': {
            pb: isMobile ? 1 : 1.5,
          },
        }}
      >
        <Typography gutterBottom={!isMobile} variant={'subtitle2'}>
          {text.title}
        </Typography>

        <Stack sx={{ gap: isMobile ? 1 : 2 }}>
          <Stack>
            <Stack
              sx={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <Stack
                sx={{
                  alignItems: 'flex-end',
                  flexDirection: 'row',
                  gap: 0.5,
                }}
              >
                <Typography variant={isMobile ? 'h5' : 'h4'}>
                  {value === 'weight' ? weightRange : averageValue}
                </Typography>

                <Typography color={'textSecondary'} variant={'subtitle1'}>
                  {text.unit}
                </Typography>
              </Stack>

              {value === 'weight' && weightDifference ? (
                <Chip
                  label={`${weightDifference > 0 ? '+' : ''}${weightDifference.toFixed(1)} ${text.unit}`}
                  size={'small'}
                  variant={'outlined'}
                  icon={
                    weightDifference > 0 ? (
                      <TrendingUp
                        color={'warning'}
                        fontSize={'small'}
                        sx={{ mx: 0.5 }}
                      />
                    ) : (
                      <TrendingDown
                        color={'success'}
                        fontSize={'small'}
                        sx={{ mx: 1 }}
                      />
                    )
                  }
                  sx={{
                    gap: 0.5,
                    bgcolor: (theme) =>
                      weightDifference > 0
                        ? alpha(theme.palette.warning.light, 0.2)
                        : alpha(theme.palette.success.main, 0.2),
                    borderColor: (theme) =>
                      weightDifference > 0
                        ? alpha(theme.palette.warning.main, 0.5)
                        : alpha(theme.palette.success.main, 0.5),
                    color: (theme) =>
                      weightDifference > 0
                        ? theme.palette.warning.light
                        : theme.palette.success.light,
                  }}
                />
              ) : null}
            </Stack>

            <Typography color={'textSecondary'} variant={'caption'}>
              {value === 'weight'
                ? 'Change over last ' + days + ' days'
                : 'Average over last ' + days + ' days'}
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
                color={theme.palette[color].light}
                // margin={{ left: -24, right: -24, top: 0, bottom: 0 }}
                data={data
                  .slice(data.length - days - 1, data.length - 1)
                  .map((row) => row[value] ?? 0)}
                sx={{
                  [`& .${areaElementClasses.root}`]: {
                    fill: `url(#area-gradient-${value})`,
                  },
                }}
                xAxis={{
                  scaleType: 'band',
                  data: data
                    .map((row) => row.date)
                    .slice(data.length - days - 1, data.length - 1),
                  valueFormatter: (value) => dateFormatter.format(value),
                }}
                yAxis={{
                  max: maxValue * 1.01,
                  min: minValue * 0.99,
                }}
              >
                <defs>
                  <linearGradient
                    id={`area-gradient-${value}`}
                    x1={'50%'}
                    x2={'50%'}
                    y1={'0%'}
                    y2={'100%'}
                  >
                    <stop
                      offset={'0%'}
                      stopColor={theme.palette[color].light}
                      stopOpacity={0.3}
                    />

                    <stop
                      offset={maxOffset}
                      stopColor={theme.palette[color].light}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
              </SparkLineChart>
            ) : null}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

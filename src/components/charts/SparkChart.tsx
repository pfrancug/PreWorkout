import type { IRow } from '@app-types/types';
import type { ChartConfig } from '@components/ui/chart';

import { Badge } from '@components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@components/ui/chart';
import { dateFormatter } from '@lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';

interface Props {
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  data: IRow[] | null;
  days?: number;
  value: 'kcal' | 'protein' | 'weight' | 'fat' | 'carbs';
}

const colorMap: Record<Props['color'], string> = {
  primary: 'var(--chart-1)',
  secondary: 'var(--chart-2)',
  error: 'var(--destructive)',
  warning: 'var(--chart-4)',
  info: 'var(--chart-3)',
  success: 'var(--chart-2)',
};

const textMap: Record<Props['value'], { title: string; unit: string }> = {
  carbs: { title: 'Carbs', unit: 'g' },
  fat: { title: 'Fat', unit: 'g' },
  kcal: { title: 'Calories', unit: 'kcal' },
  protein: { title: 'Protein', unit: 'g' },
  weight: { title: 'Weight', unit: 'kg' },
};

export const SparkChart = ({ color, data, days = 14, value }: Props) => {
  const chartConfig = useMemo(
    () =>
      ({
        [value]: {
          label: textMap[value].title,
          color: colorMap[color],
        },
      }) satisfies ChartConfig,
    [color, value],
  );

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    return [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [data]);

  const chartData = useMemo(() => {
    if (sortedData.length === 0) {
      return [];
    }

    return sortedData.slice(-days).map((row) => ({
      date: dateFormatter.format(row.date),
      [value]: row[value] ?? 0,
    }));
  }, [sortedData, days, value]);

  const slicedData = useMemo(() => {
    if (sortedData.length === 0) {
      return [];
    }

    return sortedData.slice(-days);
  }, [sortedData, days]);

  const { minValue, maxValue } = useMemo(() => {
    if (slicedData.length === 0) {
      return { minValue: 0, maxValue: 0 };
    }
    const validValues = slicedData
      .map((row) => row[value])
      .filter((v) => v !== null) as number[];
    if (validValues.length === 0) {
      return { minValue: 0, maxValue: 0 };
    }
    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    const padding = value === 'weight' ? 1 : 50;

    return {
      minValue: min * 0.99 - padding,
      maxValue: max * 1.01 + padding,
    };
  }, [slicedData, value]);

  const averageValue = useMemo(() => {
    if (!data) {
      return '0.0';
    }
    const validValues = slicedData.filter((row) => row[value] !== null);
    const sum = validValues.reduce((acc, row) => acc + (row[value] ?? 0), 0);

    return validValues.length > 0 ? (sum / validValues.length).toFixed(1) : '0';
  }, [data, slicedData, value]);

  const valueDifference = useMemo(() => {
    if (slicedData.length === 0) {
      return 0;
    }
    const firstValidValue = slicedData.find((row) => row[value] !== null)?.[
      value
    ];
    const lastValidValue = [...slicedData]
      .reverse()
      .find((row) => row[value] !== null)?.[value];

    return firstValidValue && lastValidValue
      ? lastValidValue - firstValidValue
      : 0;
  }, [slicedData, value]);

  const text = textMap[value];
  const gradientId = `fill-${value}`;
  const isWeight = value === 'weight';

  return (
    <Card className={'@container/card bg-card shadow-xs'}>
      <CardHeader>
        <CardDescription>{text.title}</CardDescription>

        <CardTitle
          className={
            'text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'
          }
        >
          {averageValue}{' '}
          <span className={'text-sm font-normal text-muted-foreground'}>
            {text.unit}
          </span>
        </CardTitle>

        <CardAction>
          {isWeight && valueDifference !== 0 && (
            <Badge variant={'outline'}>
              {valueDifference > 0 ? (
                <TrendingUp className={'text-yellow-500'} />
              ) : (
                <TrendingDown className={'text-green-500'} />
              )}
              {valueDifference > 0 ? '+' : ''}
              {valueDifference.toFixed(1)} {text.unit}
            </Badge>
          )}
        </CardAction>
      </CardHeader>

      <CardFooter className={'flex-col items-start gap-1.5 text-sm'}>
        {/* {isWeight && valueDifference !== 0 && (
          <div className="line-clamp-1 flex gap-2 font-medium">
            {valueDifference > 0 ? 'Weight increased' : 'Weight decreased'}
            {valueDifference > 0 ? (
              <TrendingUp className="size-4 text-yellow-500" />
            ) : (
              <TrendingDown className="size-4 text-green-500" />
            )}
          </div>
        )} */}
        <div className={'text-muted-foreground'}>
          {isWeight
            ? `Change over last ${days} days`
            : `Average over last ${days} days`}
        </div>
      </CardFooter>

      <div className={'px-6 pb-4'}>
        <ChartContainer className={'h-[60px] w-full'} config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={gradientId}
                x1={'0'}
                x2={'0'}
                y1={'0'}
                y2={'1'}
              >
                <stop
                  offset={'0%'}
                  stopColor={colorMap[color]}
                  stopOpacity={0.4}
                />

                <stop
                  offset={'100%'}
                  stopColor={colorMap[color]}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <XAxis hide dataKey={'date'} />

            <YAxis hide domain={[minValue, maxValue]} />

            <ChartTooltip
              content={<ChartTooltipContent indicator={'line'} />}
              cursor={false}
            />

            <Area
              dataKey={value}
              fill={`url(#${gradientId})`}
              stroke={colorMap[color]}
              strokeWidth={2}
              type={'monotone'}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </Card>
  );
};

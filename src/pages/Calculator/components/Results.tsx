import type { ICalculateResult } from '../utils/calculate';
import type { ReactNode } from 'react';

import { ArrowDown, Scale, TrendingDown, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ResultsProps {
  result: ICalculateResult;
}

interface ResultRowProps {
  title: string;
  calories: number;
  deficit: number;
  color: 'emerald' | 'yellow' | 'orange' | 'red';
  icon: ReactNode;
}

const colorMap = {
  emerald: {
    border: 'border-l-emerald-400',
    bg: 'bg-emerald-400/10',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  yellow: {
    border: 'border-l-amber-400',
    bg: 'bg-amber-400/10',
    text: 'text-amber-600 dark:text-amber-400',
  },
  orange: {
    border: 'border-l-orange-400',
    bg: 'bg-orange-400/10',
    text: 'text-orange-600 dark:text-orange-400',
  },
  red: {
    border: 'border-l-red-500',
    bg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
  },
};

const ResultRow = ({
  title,
  calories,
  deficit,
  color,
  icon,
}: ResultRowProps) => {
  const { t } = useTranslation();
  const colors = colorMap[color];

  return (
    <div
      className={`flex items-center justify-between rounded-lg border border-l-4 ${colors.border} p-4 transition-colors hover:bg-muted/50`}
    >
      <div className={'flex items-center gap-3'}>
        <div className={`rounded-md p-2 ${colors.bg} ${colors.text}`}>
          {icon}
        </div>

        <div>
          <p className={'text-sm font-medium'}>{title}</p>

          {deficit > 0 && (
            <p className={'text-xs text-muted-foreground'}>
              {'-'}
              {deficit}
              {t('calculator.results.deficit')}
            </p>
          )}
        </div>
      </div>

      <div className={'text-right'}>
        <p className={'text-lg font-bold tabular-nums'}>
          {calories.toLocaleString()}
        </p>

        <p className={'text-xs text-muted-foreground'}>
          {t('calculator.results.perDay')}
        </p>
      </div>
    </div>
  );
};

export const Results = ({ result }: ResultsProps) => {
  const { t } = useTranslation();

  return (
    <div className={'space-y-6'}>
      <div className={'rounded-xl border bg-card p-6 text-center'}>
        <p className={'text-sm font-medium text-muted-foreground'}>
          {t('calculator.results.tdee')}
        </p>

        <p className={'mt-1 text-5xl font-bold tracking-tight'}>
          {result.maintain.toLocaleString()}
        </p>

        <p className={'mt-1 text-sm text-muted-foreground'}>
          {t('calculator.results.perDay')}
        </p>

        <div className={'mt-4 border-t pt-4'}>
          <p className={'text-xs text-muted-foreground'}>
            {t('calculator.results.bmr')}
            {': '}

            <span className={'font-semibold text-foreground'}>
              {result.bmr.toLocaleString()}
            </span>

            {' kcal'}
          </p>
        </div>
      </div>

      <div className={'space-y-3'}>
        <h3 className={'text-sm font-medium text-muted-foreground'}>
          {t('calculator.results.plans')}
        </h3>

        <div className={'grid gap-3'}>
          <ResultRow
            calories={result.maintain}
            color={'emerald'}
            deficit={0}
            icon={<Scale className={'size-4'} />}
            title={t('calculator.results.maintain')}
          />

          <ResultRow
            calories={result.mid}
            color={'yellow'}
            deficit={result.midDeficit}
            icon={<TrendingDown className={'size-4'} />}
            title={t('calculator.results.midLoss')}
          />

          <ResultRow
            calories={result.loss}
            color={'orange'}
            deficit={result.lossDeficit}
            icon={<ArrowDown className={'size-4'} />}
            title={t('calculator.results.loss')}
          />

          <ResultRow
            calories={result.extreme}
            color={'red'}
            deficit={result.extremeDeficit}
            icon={<Zap className={'size-4'} />}
            title={t('calculator.results.extreme')}
          />
        </div>
      </div>
    </div>
  );
};

import type { ICalculateResult } from '../utils/calculate';

import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { useTranslation } from 'react-i18next';

import { Result } from './Result';

interface ResultsProps {
  result: ICalculateResult | null;
}

export const Results = ({ result }: ResultsProps) => {
  const { t } = useTranslation();

  if (!result) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('calculator.results.title')}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className={'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'}>
          <Result
            calories={result.maintain}
            color={'green'}
            percentage={result.maintainPercent}
            title={t('calculator.results.maintain')}
          />

          <Result
            calories={result.mid}
            color={'yellow'}
            percentage={result.midPercent}
            title={t('calculator.results.midLoss')}
          />

          <Result
            calories={result.loss}
            color={'orange'}
            percentage={result.lossPercent}
            title={t('calculator.results.loss')}
          />

          <Result
            calories={result.extreme}
            color={'red'}
            percentage={result.extremePercent}
            title={t('calculator.results.extreme')}
          />
        </div>
      </CardContent>
    </Card>
  );
};

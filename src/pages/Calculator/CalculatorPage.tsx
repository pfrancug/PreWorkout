import type { ICalculatorForm } from './types/form';
import type { ICalculateResult } from './utils/calculate';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CALCULATOR_DEFAULTS } from '../../constants/storage';
import { useSettings } from '../../contexts/useSettings';
import { useDataSet } from '../../hooks/useDataSet';
import { CalculatorForm } from './components/CalculatorForm';
import { Equation } from './components/Equation';
import { Results } from './components/Results';
import { calculate } from './utils/calculate';

export const CalculatorPage = () => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { dataSet } = useDataSet();

  const lastWeight = useMemo(() => {
    if (!dataSet || dataSet.length === 0) {
      return null;
    }

    const sorted = [...dataSet].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
    const rowWithWeight = sorted.find(
      (row) => row.weight !== null && row.weight > 0,
    );

    return rowWithWeight?.weight ?? null;
  }, [dataSet]);

  const initialValues = useMemo<ICalculatorForm>(
    () => ({
      gender:
        settings.sex === 'male' || settings.sex === 'female'
          ? settings.sex
          : 'male',
      age: settings.age ? Number(settings.age) : CALCULATOR_DEFAULTS.AGE,
      height: settings.height
        ? Number(settings.height)
        : CALCULATOR_DEFAULTS.HEIGHT,
      weight: lastWeight ?? CALCULATOR_DEFAULTS.WEIGHT,
      activity: CALCULATOR_DEFAULTS.ACTIVITY,
    }),
    [settings.sex, settings.age, settings.height, lastWeight],
  );

  const [formValues, setFormValues] = useState<ICalculatorForm>(initialValues);
  const [result, setResult] = useState<ICalculateResult | null>(null);

  const handleChange = <K extends keyof ICalculatorForm>(
    field: K,
    value: ICalculatorForm[K],
  ) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleCalculate = () => {
    const calcResult = calculate(formValues);
    setResult(calcResult);
  };

  return (
    <div
      className={
        'mx-auto w-full max-w-screen-2xl flex flex-1 flex-col gap-6 p-6'
      }
    >
      <div className={'space-y-1'}>
        <h1 className={'text-3xl font-bold tracking-tight'}>
          {t('calculator.title')}
        </h1>

        <p className={'text-muted-foreground'}>{t('calculator.description')}</p>
      </div>

      <div className={'grid grid-cols-1 lg:grid-cols-2 gap-6'}>
        <CalculatorForm
          onCalculate={handleCalculate}
          onChange={handleChange}
          values={formValues}
        />

        <Equation />
      </div>

      <Results result={result} />
    </div>
  );
};

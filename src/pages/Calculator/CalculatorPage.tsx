import type { ICalculatorForm } from './types/form';

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

  const result = useMemo(() => calculate(formValues), [formValues]);

  const handleChange = <K extends keyof ICalculatorForm>(
    field: K,
    value: ICalculatorForm[K],
  ) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className={'mx-auto w-full max-w-3xl flex flex-1 flex-col gap-8 p-6'}>
      <div className={'space-y-1'}>
        <h1 className={'text-3xl font-bold tracking-tight'}>
          {t('calculator.title')}
        </h1>

        <p className={'text-muted-foreground'}>{t('calculator.description')}</p>
      </div>

      <CalculatorForm onChange={handleChange} values={formValues} />

      <Results result={result} />

      <Equation />
    </div>
  );
};

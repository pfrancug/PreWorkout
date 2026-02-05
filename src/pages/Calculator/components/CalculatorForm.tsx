import type { ICalculatorForm } from '../types/form';

import { Button } from '@components/ui/button';
import { Card, CardContent } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { useTranslation } from 'react-i18next';

import { ActivityOptions } from '../constants/activity-options';

interface CalculatorFormProps {
  values: ICalculatorForm;
  onChange: <K extends keyof ICalculatorForm>(
    field: K,
    value: ICalculatorForm[K],
  ) => void;
}

export const CalculatorForm = ({ values, onChange }: CalculatorFormProps) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className={'space-y-6 pt-6'}>
        <div className={'space-y-2'}>
          <Label>{t('calculator.form.gender')}</Label>

          <div className={'grid grid-cols-2 gap-2'}>
            <Button
              className={'w-full'}
              onClick={() => onChange('gender', 'male')}
              variant={values.gender === 'male' ? 'default' : 'outline'}
            >
              {t('calculator.form.male')}
            </Button>

            <Button
              className={'w-full'}
              onClick={() => onChange('gender', 'female')}
              variant={values.gender === 'female' ? 'default' : 'outline'}
            >
              {t('calculator.form.female')}
            </Button>
          </div>
        </div>

        <div className={'grid grid-cols-3 gap-4'}>
          <div className={'space-y-2'}>
            <Label htmlFor={'age'}>{t('calculator.form.age')}</Label>

            <div className={'relative'}>
              <Input
                className={'pr-14'}
                id={'age'}
                max={120}
                min={1}
                onChange={(e) => onChange('age', Number(e.target.value))}
                type={'number'}
                value={values.age}
              />

              <span
                className={
                  'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground'
                }
              >
                {t('calculator.form.years')}
              </span>
            </div>
          </div>

          <div className={'space-y-2'}>
            <Label htmlFor={'height'}>{t('calculator.form.heightLabel')}</Label>

            <div className={'relative'}>
              <Input
                className={'pr-10'}
                id={'height'}
                min={1}
                onChange={(e) => onChange('height', Number(e.target.value))}
                type={'number'}
                value={values.height}
              />

              <span
                className={
                  'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground'
                }
              >
                {'cm'}
              </span>
            </div>
          </div>

          <div className={'space-y-2'}>
            <Label htmlFor={'weight'}>{t('calculator.form.weightLabel')}</Label>

            <div className={'relative'}>
              <Input
                className={'pr-10'}
                id={'weight'}
                min={1}
                onChange={(e) => onChange('weight', Number(e.target.value))}
                type={'number'}
                value={values.weight}
              />

              <span
                className={
                  'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground'
                }
              >
                {'kg'}
              </span>
            </div>
          </div>
        </div>

        <div className={'space-y-2'}>
          <Label htmlFor={'activity'}>{t('calculator.form.activity')}</Label>

          <Select
            onValueChange={(value) => onChange('activity', Number(value))}
            value={values.activity.toString()}
          >
            <SelectTrigger id={'activity'}>
              <SelectValue
                placeholder={t('calculator.form.activityPlaceholder')}
              />
            </SelectTrigger>

            <SelectContent>
              {ActivityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {t(option.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

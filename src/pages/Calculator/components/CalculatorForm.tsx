import type { ICalculatorForm } from '../types/form';

import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { RadioGroup, RadioGroupItem } from '@components/ui/radio-group';
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
  onCalculate: () => void;
}

export function CalculatorForm({
  values,
  onChange,
  onCalculate,
}: CalculatorFormProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('calculator.form.title')}</CardTitle>
      </CardHeader>

      <CardContent className={'space-y-6'}>
        <div className={'space-y-3'}>
          <Label>{t('calculator.form.gender')}</Label>

          <RadioGroup
            className={'flex gap-4'}
            value={values.gender}
            onValueChange={(value) =>
              onChange('gender', value as 'male' | 'female')
            }
          >
            <div className={'flex items-center space-x-2'}>
              <RadioGroupItem id={'male'} value={'male'} />

              <Label className={'font-normal cursor-pointer'} htmlFor={'male'}>
                {t('calculator.form.male')}
              </Label>
            </div>

            <div className={'flex items-center space-x-2'}>
              <RadioGroupItem id={'female'} value={'female'} />

              <Label
                className={'font-normal cursor-pointer'}
                htmlFor={'female'}
              >
                {t('calculator.form.female')}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className={'grid grid-cols-1 md:grid-cols-3 gap-4'}>
          <div className={'space-y-2'}>
            <Label htmlFor={'age'}>{t('calculator.form.age')}</Label>

            <Input
              id={'age'}
              max={120}
              min={1}
              onChange={(e) => onChange('age', Number(e.target.value))}
              type={'number'}
              value={values.age}
            />
          </div>

          <div className={'space-y-2'}>
            <Label htmlFor={'height'}>{t('calculator.form.height')}</Label>

            <Input
              id={'height'}
              min={1}
              onChange={(e) => onChange('height', Number(e.target.value))}
              type={'number'}
              value={values.height}
            />
          </div>

          <div className={'space-y-2'}>
            <Label htmlFor={'weight'}>{t('calculator.form.weight')}</Label>

            <Input
              id={'weight'}
              min={1}
              onChange={(e) => onChange('weight', Number(e.target.value))}
              type={'number'}
              value={values.weight}
            />
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

        <Button className={'w-full'} onClick={onCalculate}>
          {t('calculator.form.calculate')}
        </Button>
      </CardContent>
    </Card>
  );
}

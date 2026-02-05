import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { useTranslation } from 'react-i18next';

export const Equation = () => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('calculator.equation.title')}</CardTitle>
      </CardHeader>

      <CardContent className={'space-y-4'}>
        <p className={'text-sm text-muted-foreground'}>
          {t('calculator.equation.description')}
        </p>

        <div className={'space-y-2 bg-muted/50 rounded-lg p-4'}>
          <p className={'text-sm font-mono'}>
            <span className={'text-blue-500'}>
              {t('calculator.form.male')}

              {':'}
            </span>{' '}
            {'BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) + 5'}
          </p>

          <p className={'text-sm font-mono'}>
            <span className={'text-pink-500'}>
              {t('calculator.form.female')}

              {':'}
            </span>{' '}
            {'BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) - 161'}
          </p>
        </div>

        <p className={'text-xs text-muted-foreground'}>
          {t('calculator.equation.note')}
        </p>
      </CardContent>
    </Card>
  );
};

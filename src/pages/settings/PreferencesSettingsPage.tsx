import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import { Label } from '@components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { useTranslation } from 'react-i18next';

import { useSettings } from '../../contexts/useSettings';

export const PreferencesSettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { changeLanguage } = useSettings();

  return (
    <div className={'mx-auto w-full max-w-3xl flex flex-1 flex-col gap-8 p-6'}>
      <div className={'space-y-1'}>
        <h1 className={'text-3xl font-bold tracking-tight'}>
          {t('settings.preferences.pageTitle')}
        </h1>

        <p className={'text-muted-foreground'}>
          {t('settings.preferences.pageDescription')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.preferences.language.title')}</CardTitle>

          <CardDescription>
            {t('settings.preferences.language.description')}
          </CardDescription>
        </CardHeader>

        <CardContent className={'space-y-4'}>
          <div className={'space-y-2'}>
            <Label>{t('settings.preferences.language.label')}</Label>

            <Select
              value={i18n.language}
              onValueChange={(value) => {
                changeLanguage(value);
              }}
            >
              <SelectTrigger className={'w-48'}>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={'en'}>{'English'}</SelectItem>

                <SelectItem value={'pl'}>{'Polski'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

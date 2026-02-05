import type { UserSettings } from '../contexts/SettingsContext';

import { Button } from '@components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { RadioGroup, RadioGroupItem } from '@components/ui/radio-group';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSettings } from '../contexts/useSettings';

export const SettingsPage = () => {
  const { t } = useTranslation();
  const { settings, updateSettings, updateField } = useSettings();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChange = (field: keyof UserSettings, value: string) => {
    updateField(field, value);
  };

  return (
    <div className={'mx-auto w-full max-w-screen-2xl p-6'}>
      <div className={'mx-auto max-w-2xl space-y-6'}>
        <div>
          <h1 className={'text-2xl font-bold'}>{t('settings.title')}</h1>

          <p className={'text-muted-foreground'}>{t('settings.description')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.personalInfo.title')}</CardTitle>

            <CardDescription>
              {t('settings.personalInfo.description')}
            </CardDescription>
          </CardHeader>

          <CardContent className={'space-y-4'}>
            <div className={'space-y-2'}>
              <Label htmlFor={'name'}>{t('settings.fields.name')}</Label>

              <Input
                id={'name'}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={t('settings.fields.namePlaceholder')}
                value={settings.name}
              />
            </div>

            <div className={'space-y-3'}>
              <Label>{t('settings.fields.sex')}</Label>

              <RadioGroup
                className={'flex gap-4'}
                onValueChange={(value) => handleChange('sex', value)}
                value={settings.sex}
              >
                <div className={'flex items-center space-x-2'}>
                  <RadioGroupItem id={'sex-male'} value={'male'} />

                  <Label
                    className={'font-normal cursor-pointer'}
                    htmlFor={'sex-male'}
                  >
                    {t('settings.fields.male')}
                  </Label>
                </div>

                <div className={'flex items-center space-x-2'}>
                  <RadioGroupItem id={'sex-female'} value={'female'} />

                  <Label
                    className={'font-normal cursor-pointer'}
                    htmlFor={'sex-female'}
                  >
                    {t('settings.fields.female')}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className={'grid gap-4 sm:grid-cols-2'}>
              <div className={'space-y-2'}>
                <Label htmlFor={'age'}>{t('settings.fields.age')}</Label>

                <Input
                  id={'age'}
                  max={'150'}
                  min={'1'}
                  onChange={(e) => handleChange('age', e.target.value)}
                  placeholder={t('settings.fields.agePlaceholder')}
                  type={'number'}
                  value={settings.age}
                />
              </div>

              <div className={'space-y-2'}>
                <Label htmlFor={'height'}>{t('settings.fields.height')}</Label>

                <Input
                  id={'height'}
                  max={'300'}
                  min={'50'}
                  onChange={(e) => handleChange('height', e.target.value)}
                  placeholder={t('settings.fields.heightPlaceholder')}
                  type={'number'}
                  value={settings.height}
                />
              </div>
            </div>

            <div className={'flex items-center gap-3 pt-4'}>
              <Button onClick={handleSave}>
                <Save className={'mr-2 h-4 w-4'} />

                {t('settings.saveChanges')}
              </Button>

              {saved && (
                <span className={'text-sm text-green-600 dark:text-green-400'}>
                  {t('settings.savedSuccess')}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

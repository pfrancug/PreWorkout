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
import { Switch } from '@components/ui/switch';
import { useTranslation } from 'react-i18next';

import { useSettings } from '../../contexts/useSettings';

export const PreferencesSettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { preferences, updatePreference, changeLanguage } = useSettings();

  return (
    <div
      className={
        'mx-auto w-full max-w-3xl flex flex-1 flex-col gap-4 p-4 lg:gap-8 lg:p-6'
      }
    >
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

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.preferences.layout.title')}</CardTitle>

          <CardDescription>
            {t('settings.preferences.layout.description')}
          </CardDescription>
        </CardHeader>

        <CardContent className={'space-y-6'}>
          <div className={'flex items-center justify-between'}>
            <div className={'space-y-0.5'}>
              <Label>{t('settings.preferences.layout.sidebar')}</Label>

              <p className={'text-sm text-muted-foreground'}>
                {t('settings.preferences.layout.sidebarDescription')}
              </p>
            </div>

            <Switch
              checked={preferences.sidebarOpen}
              onCheckedChange={(checked) =>
                updatePreference('sidebarOpen', checked)
              }
            />
          </div>

          <div className={'flex items-center justify-between'}>
            <div className={'space-y-0.5'}>
              <Label>{t('settings.preferences.layout.chatPanel')}</Label>

              <p className={'text-sm text-muted-foreground'}>
                {t('settings.preferences.layout.chatPanelDescription')}
              </p>
            </div>

            <Switch
              checked={preferences.chatPanelOpen}
              onCheckedChange={(checked) =>
                updatePreference('chatPanelOpen', checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.preferences.calendarView.title')}</CardTitle>

          <CardDescription>
            {t('settings.preferences.calendarView.description')}
          </CardDescription>
        </CardHeader>

        <CardContent className={'space-y-4'}>
          <div className={'space-y-2'}>
            <Label>{t('settings.preferences.calendarView.label')}</Label>

            <Select
              value={preferences.defaultCalendarView}
              onValueChange={(value) =>
                updatePreference(
                  'defaultCalendarView',
                  value as 'month' | 'week',
                )
              }
            >
              <SelectTrigger className={'w-48'}>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={'month'}>
                  {t('calendar.monthView')}
                </SelectItem>

                <SelectItem value={'week'}>{t('calendar.weekView')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

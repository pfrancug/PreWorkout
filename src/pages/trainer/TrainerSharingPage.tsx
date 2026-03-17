import { Badge } from '@components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import { Label } from '@components/ui/label';
import { Switch } from '@components/ui/switch';
import { useSettings } from '@contexts/useSettings';
import { BookOpen, CalendarDays, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const TrainerSharingPage = () => {
  const { t } = useTranslation();
  const { sharingPreferences, updateSharingPreference } = useSettings();

  return (
    <div
      className={
        'mx-auto w-full max-w-3xl flex flex-1 flex-col gap-4 p-4 lg:gap-8 lg:p-6'
      }
    >
      <div className={'space-y-1'}>
        <h1 className={'text-3xl font-bold tracking-tight'}>
          {t('settings.trainer.sharingPageTitle')}
        </h1>

        <p className={'text-muted-foreground'}>
          {t('settings.trainer.sharingPageDescription')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className={'flex items-center gap-2'}>
            <Camera className={'h-5 w-5 text-muted-foreground'} />
            <CardTitle>{t('settings.trainer.sharingNamePhoto')}</CardTitle>
          </div>

          <CardDescription>
            {t('settings.trainer.sharingNamePhotoDescription')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className={'flex items-center justify-between'}>
            <Label>{t('settings.trainer.sharingNamePhoto')}</Label>

            <Badge variant={'secondary'}>
              {t('settings.trainer.sharingNamePhotoAlwaysOn')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className={'flex items-center gap-2'}>
            <CalendarDays className={'h-5 w-5 text-muted-foreground'} />
            <CardTitle>
              {t('settings.trainer.sharingCalendarActivities')}
            </CardTitle>
          </div>

          <CardDescription>
            {t('settings.trainer.sharingCalendarActivitiesDescription')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className={'flex items-center justify-between'}>
            <div className={'space-y-0.5'}>
              <Label htmlFor={'share-calendar-switch'}>
                {t('settings.trainer.sharingCalendarActivities')}
              </Label>
            </div>

            <Switch
              checked={sharingPreferences.shareCalendarActivities}
              id={'share-calendar-switch'}
              onCheckedChange={(checked) =>
                updateSharingPreference('shareCalendarActivities', checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className={'flex items-center gap-2'}>
            <BookOpen className={'h-5 w-5 text-muted-foreground'} />
            <CardTitle>{t('settings.trainer.sharingDiary')}</CardTitle>
          </div>

          <CardDescription>
            {t('settings.trainer.sharingDiaryDescription')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className={'flex items-center justify-between'}>
            <div className={'space-y-0.5'}>
              <Label htmlFor={'share-diary-switch'}>
                {t('settings.trainer.sharingDiary')}
              </Label>
            </div>

            <Switch
              checked={sharingPreferences.shareDiary}
              id={'share-diary-switch'}
              onCheckedChange={(checked) =>
                updateSharingPreference('shareDiary', checked)
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

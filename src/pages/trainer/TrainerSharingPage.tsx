import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import { useTranslation } from 'react-i18next';

export const TrainerSharingPage = () => {
  const { t } = useTranslation();

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
          <CardTitle>{t('settings.trainer.sharingPageTitle')}</CardTitle>
          <CardDescription>
            {t('settings.trainer.sharingPageDescription')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p className={'text-sm text-muted-foreground text-center py-6'}>
            {t('settings.trainer.sharingComingSoon')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

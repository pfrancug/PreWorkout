import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useAuth } from '../contexts/useAuth';

const formatBold = (text: string): ReactNode[] =>
  text
    .split(/\*\*(.*?)\*\*/g)
    .map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));

export const PrivacyPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className={'mx-auto w-full max-w-3xl p-6'}>
      <Card>
        <CardHeader>
          <CardTitle className={'text-2xl'}>
            {t('legal.privacy.title')}
          </CardTitle>

          <p className={'text-sm text-muted-foreground'}>
            {t('legal.privacy.description')}
          </p>
        </CardHeader>

        <CardContent className={'space-y-6'}>
          <section>
            <h2 className={'mb-2 text-lg font-semibold'}>
              {t('legal.privacy.sections.dataCollection.title')}
            </h2>
            <p className={'whitespace-pre-line text-sm text-muted-foreground'}>
              {formatBold(t('legal.privacy.sections.dataCollection.content'))}
            </p>
          </section>

          <section>
            <h2 className={'mb-2 text-lg font-semibold'}>
              {t('legal.privacy.sections.dataUsage.title')}
            </h2>
            <p className={'whitespace-pre-line text-sm text-muted-foreground'}>
              {t('legal.privacy.sections.dataUsage.content')}
            </p>
          </section>

          <section>
            <h2 className={'mb-2 text-lg font-semibold'}>
              {t('legal.privacy.sections.dataStorage.title')}
            </h2>
            <p className={'whitespace-pre-line text-sm text-muted-foreground'}>
              {t('legal.privacy.sections.dataStorage.content')}
            </p>
          </section>

          <section>
            <h2 className={'mb-2 text-lg font-semibold'}>
              {t('legal.privacy.sections.thirdParties.title')}
            </h2>
            <p className={'whitespace-pre-line text-sm text-muted-foreground'}>
              {formatBold(t('legal.privacy.sections.thirdParties.content'))}
            </p>
          </section>

          <section>
            <h2 className={'mb-2 text-lg font-semibold'}>
              {t('legal.privacy.sections.yourRights.title')}
            </h2>
            <p className={'whitespace-pre-line text-sm text-muted-foreground'}>
              {formatBold(t('legal.privacy.sections.yourRights.content'))}
            </p>
          </section>

          <section>
            <h2 className={'mb-2 text-lg font-semibold'}>
              {t('legal.privacy.sections.contact.title')}
            </h2>
            <p className={'whitespace-pre-line text-sm text-muted-foreground'}>
              {t('legal.privacy.sections.contact.content')}
            </p>
          </section>

          <div className={'border-t pt-4'}>
            <Link
              className={'text-primary hover:underline'}
              to={user ? '/settings' : '/login'}
            >
              {'← '}
              {user ? t('legal.backToSettings') : t('legal.backToLogin')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

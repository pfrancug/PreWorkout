import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { useAuth } from '@contexts/useAuth';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

const formatBold = (text: string): ReactNode[] =>
  text
    .split(/\*\*(.*?)\*\*/g)
    .map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));

export const PrivacyPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className={'mx-auto w-full max-w-3xl p-4 lg:p-6'}>
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
            {user ? (
              <button
                className={'text-primary hover:underline cursor-pointer'}
                onClick={() => navigate(-1)}
                type={'button'}
              >
                <ArrowLeft className={'mr-1 inline size-4'} />
                {t('legal.backToSettings')}
              </button>
            ) : (
              <Link className={'text-primary hover:underline'} to={'/login'}>
                <ArrowLeft className={'mr-1 inline size-4'} />
                {t('legal.backToLogin')}
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

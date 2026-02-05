import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useAuth } from '../contexts/useAuth';

export const TermsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className={'mx-auto w-full max-w-3xl p-6'}>
      <Card>
        <CardHeader>
          <CardTitle className={'text-2xl'}>{t('legal.terms.title')}</CardTitle>

          <p className={'text-sm text-muted-foreground'}>
            {t('legal.terms.description')}
          </p>
        </CardHeader>

        <CardContent className={'space-y-6'}>
          <section>
            <h2 className={'mb-2 text-lg font-semibold'}>
              {t('legal.terms.sections.acceptance.title')}
            </h2>
            <p className={'whitespace-pre-line text-sm text-muted-foreground'}>
              {t('legal.terms.sections.acceptance.content')}
            </p>
          </section>

          <section>
            <h2 className={'mb-2 text-lg font-semibold'}>
              {t('legal.terms.sections.healthDisclaimer.title')}
            </h2>
            <p className={'whitespace-pre-line text-sm text-muted-foreground'}>
              {t('legal.terms.sections.healthDisclaimer.content')}
            </p>
          </section>

          <section>
            <h2 className={'mb-2 text-lg font-semibold'}>
              {t('legal.terms.sections.userResponsibilities.title')}
            </h2>
            <p className={'whitespace-pre-line text-sm text-muted-foreground'}>
              {t('legal.terms.sections.userResponsibilities.content')}
            </p>
          </section>

          <section>
            <h2 className={'mb-2 text-lg font-semibold'}>
              {t('legal.terms.sections.intellectualProperty.title')}
            </h2>
            <p className={'whitespace-pre-line text-sm text-muted-foreground'}>
              {t('legal.terms.sections.intellectualProperty.content')}
            </p>
          </section>

          <section>
            <h2 className={'mb-2 text-lg font-semibold'}>
              {t('legal.terms.sections.limitation.title')}
            </h2>
            <p className={'whitespace-pre-line text-sm text-muted-foreground'}>
              {t('legal.terms.sections.limitation.content')}
            </p>
          </section>

          <section>
            <h2 className={'mb-2 text-lg font-semibold'}>
              {t('legal.terms.sections.changes.title')}
            </h2>
            <p className={'whitespace-pre-line text-sm text-muted-foreground'}>
              {t('legal.terms.sections.changes.content')}
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

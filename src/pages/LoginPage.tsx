import { Alert, AlertDescription } from '@components/ui/alert';
import { Button } from '@components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import { cn } from '@lib/utils';
import { Dumbbell, Globe, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { signInWithGoogle } from '../firebase/auth';

export const LoginPage = () => {
  const { t, i18n } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleLanguage = () => {
    const next = i18n.language === 'pl' ? 'en' : 'pl';
    i18n.changeLanguage(next);
    localStorage.setItem('i18nextLng', next);
  };

  return (
    <div className={cn('flex flex-col gap-6')}>
      <Card>
        <CardHeader className={'text-center'}>
          <div className={'mb-2 flex justify-center'}>
            <div
              className={
                'flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-red-500 text-white'
              }
            >
              <Dumbbell className={'size-7'} />
            </div>
          </div>

          <CardTitle className={'text-xl'}>{t('auth.login')}</CardTitle>

          <CardDescription>{t('auth.loginDescription')}</CardDescription>
        </CardHeader>

        <CardContent>
          <div className={'flex flex-col gap-6'}>
            {errorMessage && (
              <Alert className={'relative'} variant={'destructive'}>
                <AlertDescription>{errorMessage}</AlertDescription>

                <button
                  onClick={() => setErrorMessage(null)}
                  type={'button'}
                  className={
                    'absolute top-2 right-2 cursor-pointer opacity-70 hover:opacity-100'
                  }
                >
                  <X className={'h-4 w-4'} />
                </button>
              </Alert>
            )}

            <Button
              className={'w-full'}
              onClick={() => signInWithGoogle({ onError: setErrorMessage })}
              type={'button'}
              variant={'outline'}
            >
              <svg
                className={'mr-2 h-4 w-4'}
                viewBox={'0 0 24 24'}
                xmlns={'http://www.w3.org/2000/svg'}
              >
                <path
                  fill={'currentColor'}
                  d={
                    'M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z'
                  }
                />
              </svg>

              {t('auth.signInWithGoogle')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className={'text-center text-xs text-muted-foreground'}>
        <Link
          className={'underline underline-offset-4 hover:text-primary'}
          to={'/privacy'}
        >
          {t('legal.privacyPolicy')}
        </Link>
        <span className={'mx-2'}>{'•'}</span>
        <Link
          className={'underline underline-offset-4 hover:text-primary'}
          to={'/terms'}
        >
          {t('legal.termsOfService')}
        </Link>
      </div>

      <div className={'flex justify-center'}>
        <button
          onClick={toggleLanguage}
          type={'button'}
          className={
            'flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground'
          }
        >
          <Globe className={'h-3.5 w-3.5'} />

          <span>{i18n.language === 'pl' ? 'English' : 'Polski'}</span>
        </button>
      </div>
    </div>
  );
};

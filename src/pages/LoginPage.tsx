import { Alert, AlertDescription } from '@components/ui/alert';
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
import { cn } from '@lib/utils';
import { Dumbbell, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { loginUser, registerUser, signInWithGoogle } from '../firebase/auth';

export const LoginPage = () => {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      registerUser({ email, password, onError: setErrorMessage });
    } else {
      loginUser({ email, password, onError: setErrorMessage });
    }
  };

  const switchMode = () => {
    setErrorMessage(null);
    setEmail('');
    setPassword('');
    setIsRegister(!isRegister);
  };

  return (
    <div className={cn('flex flex-col gap-6')}>
      <Card>
        <CardHeader className={'text-center'}>
          <div className={'mb-2 flex justify-center'}>
            <div
              className={
                'flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white'
              }
            >
              <Dumbbell className={'size-5'} />
            </div>
          </div>

          <CardTitle className={'text-xl'}>
            {isRegister ? t('auth.createAccount') : t('auth.login')}
          </CardTitle>

          <CardDescription>
            {isRegister
              ? t('auth.createAccountDescription')
              : t('auth.loginDescription')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className={'flex flex-col gap-6'}>
              {errorMessage && (
                <Alert className={'relative'} variant={'destructive'}>
                  <AlertDescription>{errorMessage}</AlertDescription>

                  <button
                    onClick={() => setErrorMessage(null)}
                    type={'button'}
                    className={
                      'absolute top-2 right-2 opacity-70 hover:opacity-100'
                    }
                  >
                    <X className={'h-4 w-4'} />
                  </button>
                </Alert>
              )}

              {!isRegister && (
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
              )}

              {!isRegister && (
                <div
                  className={
                    'relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border'
                  }
                >
                  <span
                    className={
                      'relative z-10 bg-card px-2 text-muted-foreground'
                    }
                  >
                    {t('auth.or')}
                  </span>
                </div>
              )}

              <div className={'space-y-2'}>
                <Label htmlFor={'email'}>{t('auth.email')}</Label>

                <Input
                  required
                  id={'email'}
                  placeholder={'email@example.com'}
                  type={'email'}
                  value={email}
                  onChange={(e) => {
                    setErrorMessage(null);
                    setEmail(e.target.value);
                  }}
                />
              </div>

              <div className={'space-y-2'}>
                <Label htmlFor={'password'}>{t('auth.password')}</Label>

                <Input
                  required
                  id={'password'}
                  type={'password'}
                  value={password}
                  onChange={(e) => {
                    setErrorMessage(null);
                    setPassword(e.target.value);
                  }}
                />
              </div>

              <Button className={'w-full'} type={'submit'}>
                {isRegister ? t('auth.register') : t('auth.signIn')}
              </Button>

              <div className={'text-center text-sm'}>
                {isRegister ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
                <button
                  className={'underline underline-offset-4 hover:text-primary'}
                  onClick={switchMode}
                  type={'button'}
                >
                  {isRegister ? t('auth.signIn') : t('auth.register')}
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

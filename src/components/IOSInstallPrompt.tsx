import { Share, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const IOS_PROMPT_DISMISSED_KEY = 'iosInstallPromptDismissed';

const isIOSSafari = () => {
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  const isStandalone =
    ('standalone' in navigator &&
      (navigator as unknown as { standalone: boolean }).standalone) ||
    window.matchMedia('(display-mode: standalone)').matches;

  return isIOS && isSafari && !isStandalone;
};

export const IOSInstallPrompt = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIOSSafari()) {
      return;
    }

    const dismissed = localStorage.getItem(IOS_PROMPT_DISMISSED_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(IOS_PROMPT_DISMISSED_KEY, 'true');
  };

  if (!visible) {
    return null;
  }

  return (
    <div
      className={
        'animate-in slide-in-from-bottom-4 fade-in fixed inset-x-0 bottom-4 z-50 mx-4 flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-lg duration-300'
      }
    >
      <div
        className={
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-red-500 text-white'
        }
      >
        <Share className={'h-5 w-5'} />
      </div>

      <div className={'min-w-0 flex-1'}>
        <p className={'text-sm font-medium'}>{t('pwa.title')}</p>

        <p className={'mt-0.5 text-xs text-muted-foreground'}>
          {t('pwa.description')}
        </p>
      </div>

      <button
        onClick={dismiss}
        type={'button'}
        className={
          'shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground'
        }
      >
        <X className={'h-4 w-4'} />
      </button>
    </div>
  );
};

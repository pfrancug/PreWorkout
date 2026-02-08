import { X } from 'lucide-react';
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
      style={{ backgroundColor: 'rgba(30, 30, 30, 0.85)' }}
      className={
        'animate-ios-slide-in fixed inset-x-0 top-4 z-50 mx-2 overflow-hidden rounded-2xl backdrop-blur-xl'
      }
    >
      <div className={'flex items-center gap-3 p-3'}>
        <div className={'relative h-10 w-10 shrink-0 drop-shadow-md'}>
          <img
            alt={'App icon'}
            className={'h-10 w-10 rounded-[22%]'}
            src={'/apple-touch-icon.svg'}
          />
          <div
            className={
              'pointer-events-none absolute inset-0 rounded-[22%] bg-gradient-to-b from-white/30 via-white/5 via-40% to-white/10'
            }
          />
          <div
            className={
              'pointer-events-none absolute inset-0 rounded-[22%] bg-gradient-to-br from-white/70 via-white/5 to-white/40'
            }
            style={{
              padding: '1px',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
            }}
          />
        </div>

        <div className={'min-w-0 flex-1'}>
          <p className={'text-[13px] font-semibold text-white'}>
            {t('pwa.title')}
          </p>

          <p className={'text-[12px] text-white/60'}>{t('pwa.description')}</p>
        </div>

        <button
          onClick={dismiss}
          type={'button'}
          className={
            'shrink-0 rounded-full bg-white/20 p-1 text-white/80 active:bg-white/30'
          }
        >
          <X className={'h-3.5 w-3.5'} />
        </button>
      </div>
    </div>
  );
};

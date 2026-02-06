import { ChevronDown } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const Equation = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);

    if (willOpen) {
      requestAnimationFrame(() => {
        contentRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        });
      });
    }
  }, [isOpen]);

  return (
    <div className={'rounded-lg border'}>
      <button
        onClick={handleToggle}
        type={'button'}
        className={
          'flex w-full items-center justify-between p-4 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
        }
      >
        {t('calculator.equation.howItWorks')}

        <ChevronDown
          className={`size-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className={'border-t px-4 pb-4 pt-3 space-y-3'} ref={contentRef}>
          <p className={'text-sm text-muted-foreground'}>
            {t('calculator.equation.description')}
          </p>

          <div className={'space-y-2 rounded-lg bg-muted/50 p-4'}>
            <p className={'text-sm font-mono'}>
              <span className={'text-sky-400'}>
                {t('calculator.form.male')}
                {':'}
              </span>{' '}
              {'BMR = 10 × weight + 6.25 × height - 5 × age + 5'}
            </p>

            <p className={'text-sm font-mono'}>
              <span className={'text-pink-400'}>
                {t('calculator.form.female')}
                {':'}
              </span>{' '}
              {'BMR = 10 × weight + 6.25 × height - 5 × age - 161'}
            </p>
          </div>

          <p className={'text-xs text-muted-foreground'}>
            {t('calculator.equation.note')}
          </p>
        </div>
      )}
    </div>
  );
};

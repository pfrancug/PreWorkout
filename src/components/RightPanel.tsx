import type { RightPanelContextProps } from './types';
import type { CSSProperties, ReactNode } from 'react';

import { useSettings } from '@contexts/useSettings';
import { cn } from '@lib/utils';
import { createContext, useCallback, useContext, useState } from 'react';

const PANEL_WIDTH = '28rem';

const RightPanelContext = createContext<RightPanelContextProps | null>(null);

const useRightPanel = () => {
  const context = useContext(RightPanelContext);
  if (!context) {
    throw new Error('useRightPanel must be used within a RightPanelProvider');
  }

  return context;
};

export const RightPanelProvider = ({ children }: { children: ReactNode }) => {
  const { preferences } = useSettings();
  const [isOpen, setIsOpen] = useState(preferences.chatPanelOpen);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <RightPanelContext.Provider value={{ isOpen, setIsOpen, toggle }}>
      {children}
    </RightPanelContext.Provider>
  );
};

export const RightPanel = ({
  children,
  className,
  suppressed = false,
}: {
  children: ReactNode;
  className?: string;
  suppressed?: boolean;
}) => {
  const { isOpen } = useRightPanel();
  const effectivelyOpen = isOpen && !suppressed;

  return (
    <div
      className={'group text-sidebar-foreground hidden md:block'}
      data-slot={'right-panel'}
      data-state={effectivelyOpen ? 'expanded' : 'collapsed'}
      style={{ '--panel-width': PANEL_WIDTH } as CSSProperties}
    >
      {/* Gap div - creates space for the panel */}
      <div
        className={cn(
          'relative bg-transparent transition-[width] duration-200 ease-linear',
          effectivelyOpen ? 'w-[var(--panel-width)]' : 'w-0',
        )}
      />

      {/* Fixed panel container */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-10 hidden h-svh w-[var(--panel-width)] p-2 pl-0 transition-[right] duration-200 ease-linear md:flex',
          !effectivelyOpen && 'right-[calc(var(--panel-width)*-1)]',
          className,
        )}
      >
        <div
          className={
            'bg-sidebar flex h-full w-full flex-col overflow-hidden rounded-xl'
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export const RightPanelTrigger = ({
  children,
  className,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) => {
  const { toggle } = useRightPanel();

  return (
    <button
      disabled={disabled}
      onClick={disabled ? undefined : toggle}
      type={'button'}
      className={cn(
        'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
};

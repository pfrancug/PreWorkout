/* eslint-disable react-refresh/only-export-components */
import { useSettings } from '@contexts/useSettings';
import { cn } from '@lib/utils';
import * as React from 'react';
import { createContext, useCallback, useContext } from 'react';

const PANEL_WIDTH = '28rem';

interface RightPanelContextProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
}

const RightPanelContext = createContext<RightPanelContextProps | null>(null);

export const useRightPanel = () => {
  const context = useContext(RightPanelContext);
  if (!context) {
    throw new Error('useRightPanel must be used within a RightPanelProvider');
  }

  return context;
};

export const RightPanelProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { preferences, updatePreference } = useSettings();

  // Use preferences directly as single source of truth
  const isOpen = preferences.chatPanelOpen;

  const setIsOpen = useCallback(
    (open: boolean) => {
      updatePreference('chatPanelOpen', open);
    },
    [updatePreference],
  );

  const toggle = useCallback(() => {
    updatePreference('chatPanelOpen', !preferences.chatPanelOpen);
  }, [updatePreference, preferences.chatPanelOpen]);

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
  children: React.ReactNode;
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
      style={{ '--panel-width': PANEL_WIDTH } as React.CSSProperties}
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
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) => {
  const { toggle } = useRightPanel();

  return (
    <button
      disabled={disabled}
      onClick={disabled ? undefined : toggle}
      className={cn(
        'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
};

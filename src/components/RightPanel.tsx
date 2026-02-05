/* eslint-disable react-refresh/only-export-components */
import { cn } from '@lib/utils';
import * as React from 'react';
import { createContext, useContext, useState } from 'react';

const PANEL_WIDTH = '28rem';

interface RightPanelContextProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
}

const RightPanelContext = createContext<RightPanelContextProps | null>(null);

export function useRightPanel() {
  const context = useContext(RightPanelContext);
  if (!context) {
    throw new Error('useRightPanel must be used within a RightPanelProvider');
  }

  return context;
}

export function RightPanelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <RightPanelContext.Provider value={{ isOpen, setIsOpen, toggle }}>
      {children}
    </RightPanelContext.Provider>
  );
}

export function RightPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isOpen } = useRightPanel();

  return (
    <div
      className={'group text-sidebar-foreground hidden md:block'}
      data-slot={'right-panel'}
      data-state={isOpen ? 'expanded' : 'collapsed'}
      style={{ '--panel-width': PANEL_WIDTH } as React.CSSProperties}
    >
      {/* Gap div - creates space for the panel */}
      <div
        className={cn(
          'relative bg-transparent transition-[width] duration-200 ease-linear',
          isOpen ? 'w-[var(--panel-width)]' : 'w-0',
        )}
      />

      {/* Fixed panel container */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-10 hidden h-svh w-[var(--panel-width)] p-2 pl-0 transition-[right] duration-200 ease-linear md:flex',
          !isOpen && 'right-[calc(var(--panel-width)*-1)]',
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
}

export function RightPanelTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { toggle } = useRightPanel();

  return (
    <button className={className} onClick={toggle}>
      {children}
    </button>
  );
}

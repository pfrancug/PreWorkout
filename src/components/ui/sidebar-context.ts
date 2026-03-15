import type { SidebarContextProps } from './types';

import { createContext, useContext } from 'react';

const SidebarContext = createContext<SidebarContextProps | null>(null);

const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }

  return context;
};

export { SidebarContext, useSidebar };

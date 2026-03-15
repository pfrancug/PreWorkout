import type { SidebarContextProps } from './types';

import React from 'react';

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

const useSidebar = () => {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }

  return context;
};

export { SidebarContext, useSidebar };
export type { SidebarContextProps } from './types';

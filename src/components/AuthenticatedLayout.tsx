import type { ReactNode } from 'react';

import { AppSidebar } from '@components/AppSidebar';
import { Chat } from '@components/Chat';
import {
  RightPanel,
  RightPanelProvider,
  RightPanelTrigger,
} from '@components/RightPanel';
import { Button } from '@components/ui/button';
import { ScrollArea } from '@components/ui/scroll-area';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@components/ui/sidebar';
import { useDataSet } from '@contexts/useDataSet';
import { useSettings } from '@contexts/useSettings';
import { useIsMobile } from '@hooks/useMobile';
import { MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

const PAGE_TITLE_KEYS: Record<string, string> = {
  '/': 'nav.dashboard',
  '/dashboard': 'nav.dashboard',
  '/diary': 'nav.diary',
  '/calendar': 'nav.calendar',
  '/calculator': 'nav.calculator',
  '/chat': 'nav.chat',
  '/settings/profile': 'nav.settingsProfile',
  '/settings/categories': 'nav.settingsCategories',
  '/settings/preferences': 'nav.settingsPreferences',
  '/settings/data': 'nav.settingsData',
  '/trainer/connection': 'nav.trainerConnect',
  '/trainer/sessions': 'nav.trainerSessions',
  '/trainer/invites': 'nav.trainerInvites',
  '/trainer/connected': 'nav.trainerConnected',
  '/trainer/sharing': 'nav.trainerSharing',
  '/admin': 'nav.admin',
};

const getPageTitleKey = (pathname: string): string => {
  const exact = PAGE_TITLE_KEYS[pathname];
  if (exact) {
    return exact;
  }

  if (pathname.match(/^\/trainer\/[^/]+$/)) {
    return 'nav.trainerView';
  }

  return 'nav.dashboard';
};

interface AuthenticatedLayoutProps {
  chatContent: ReactNode;
  children: ReactNode;
}

export const AuthenticatedLayout = ({
  chatContent,
  children,
}: AuthenticatedLayoutProps) => {
  const { t } = useTranslation();
  const { preferences } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const { dataSet } = useDataSet();
  const isMobile = useIsMobile();

  const isChat = location.pathname === '/chat';
  const pageTitle = t(getPageTitleKey(location.pathname));

  return (
    <RightPanelProvider>
      <SidebarProvider defaultOpen={preferences.sidebarOpen}>
        <AppSidebar />

        <SidebarInset>
          <header
            className={'flex h-12 shrink-0 items-center gap-2 border-b px-4'}
          >
            <SidebarTrigger className={'-ml-1'} />

            <span className={'text-sm font-medium'}>{pageTitle}</span>

            <div className={'ml-auto'}>
              {isMobile ? (
                <Button
                  className={'-mr-1 size-7'}
                  disabled={isChat}
                  onClick={() => navigate('/chat')}
                  size={'icon'}
                  variant={'ghost'}
                >
                  <MessageSquare className={'h-4 w-4'} />
                </Button>
              ) : (
                <RightPanelTrigger disabled={isChat}>
                  <Button
                    className={'-mr-1 size-7'}
                    disabled={isChat}
                    size={'icon'}
                    variant={'ghost'}
                  >
                    <MessageSquare className={'h-4 w-4'} />
                  </Button>
                </RightPanelTrigger>
              )}
            </div>
          </header>

          {isChat ? (
            <div className={'flex min-h-0 flex-1 flex-col overflow-hidden'}>
              {chatContent}
            </div>
          ) : (
            <ScrollArea className={'min-h-0 flex-1'}>{children}</ScrollArea>
          )}
        </SidebarInset>

        <RightPanel suppressed={isChat}>
          <Chat dataset={dataSet} />
        </RightPanel>
      </SidebarProvider>
    </RightPanelProvider>
  );
};

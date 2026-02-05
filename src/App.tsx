import type { IRow } from './types/types';

import { Button } from '@components/ui/button';
import { Separator } from '@components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@components/ui/sidebar';
import { Toaster } from '@components/ui/sonner';
import { MessageSquare } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import { AppSidebar } from './components/AppSidebar';
import { Chat } from './components/Chat';
import { Loader } from './components/Loader';
import {
  RightPanel,
  RightPanelProvider,
  RightPanelTrigger,
} from './components/RightPanel';
import { AuthProvider } from './contexts/AuthProvider';
import { DataProvider } from './contexts/DataContext';
import { SettingsProvider } from './contexts/SettingsProvider';
import { useAuth } from './contexts/useAuth';
import { useSettings } from './contexts/useSettings';
import { useDataSet } from './hooks/useDataSet';
import { cn } from './lib/utils';
import { CalculatorPage } from './pages/Calculator';
import { ChatPage } from './pages/ChatPage';
import { DiaryPage } from './pages/DiaryPage';
import { LoginPage } from './pages/LoginPage';
import { MainPage } from './pages/MainPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { SettingsPage } from './pages/SettingsPage';
import { TermsPage } from './pages/TermsPage';

const ChatPanel = ({ dataset }: { dataset: IRow[] | null }) => {
  return <Chat dataset={dataset} />;
};

const pageTitleKeys: Record<string, string> = {
  '/': 'nav.dashboard',
  '/dashboard': 'nav.dashboard',
  '/diary': 'nav.diary',
  '/calculator': 'nav.calculator',
  '/chat': 'nav.chat',
  '/settings': 'nav.settings',
};

const AppRoutes = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const { preferences, updatePreference } = useSettings();
  const location = useLocation();
  const { dataSet } = useDataSet();

  const pageTitle = t(pageTitleKeys[location.pathname] || 'nav.dashboard');

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return (
      <Routes>
        <Route
          path={'/login'}
          element={
            <div
              className={
                'bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10'
              }
            >
              <div className={'flex w-full max-w-sm flex-col gap-6'}>
                <LoginPage />
              </div>
            </div>
          }
        />

        <Route
          path={'/privacy'}
          element={
            <div className={'bg-muted min-h-svh'}>
              <PrivacyPage />
            </div>
          }
        />

        <Route
          path={'/terms'}
          element={
            <div className={'bg-muted min-h-svh'}>
              <TermsPage />
            </div>
          }
        />

        <Route element={<Navigate replace to={'/login'} />} path={'*'} />
      </Routes>
    );
  }

  return (
    <RightPanelProvider>
      <SidebarProvider
        onOpenChange={(open) => updatePreference('sidebarOpen', open)}
        open={preferences.sidebarOpen}
      >
        <AppSidebar />

        <SidebarInset>
          <header
            className={'flex h-12 shrink-0 items-center gap-2 border-b px-4'}
          >
            <SidebarTrigger className={'-ml-1'} />

            <Separator className={'mr-2 h-4'} orientation={'vertical'} />

            <span className={'text-sm font-medium'}>{pageTitle}</span>

            <div className={'ml-auto'}>
              <RightPanelTrigger disabled={location.pathname === '/chat'}>
                <Button
                  className={'-mr-1 size-7'}
                  disabled={location.pathname === '/chat'}
                  size={'icon'}
                  variant={'ghost'}
                >
                  <MessageSquare className={'h-4 w-4'} />
                </Button>
              </RightPanelTrigger>
            </div>
          </header>

          <div
            className={cn(
              'flex min-h-0 flex-1 flex-col',
              location.pathname === '/chat'
                ? 'overflow-hidden'
                : 'overflow-auto p-4',
            )}
          >
            <Routes>
              <Route element={<MainPage />} path={'/'} />

              <Route element={<MainPage />} path={'/dashboard'} />

              <Route element={<DiaryPage />} path={'/diary'} />

              <Route element={<CalculatorPage />} path={'/calculator'} />

              <Route element={<ChatPage />} path={'/chat'} />

              <Route element={<SettingsPage />} path={'/settings'} />

              <Route element={<PrivacyPage />} path={'/privacy'} />

              <Route element={<TermsPage />} path={'/terms'} />

              <Route element={<Navigate replace to={'/'} />} path={'/login'} />

              <Route element={<Navigate replace to={'/'} />} path={'*'} />
            </Routes>
          </div>
        </SidebarInset>

        <RightPanel suppressed={location.pathname === '/chat'}>
          <ChatPanel dataset={dataSet} />
        </RightPanel>
      </SidebarProvider>
    </RightPanelProvider>
  );
};

export const App = () => {
  useEffect(() => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.style.display = 'none';
    }
    const root = document.getElementById('root');
    if (root) {
      root.style.display = 'block';
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <DataProvider>
            <AppRoutes />
            <Toaster />
          </DataProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

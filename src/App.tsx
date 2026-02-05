import type { IRow } from './types/types';

import { Button } from '@components/ui/button';
import { Separator } from '@components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@components/ui/sidebar';
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
  useRightPanel,
} from './components/RightPanel';
import { AuthProvider } from './contexts/AuthProvider';
import { SettingsProvider } from './contexts/SettingsProvider';
import { useAuth } from './contexts/useAuth';
import { useDataSet } from './hooks/useDataSet';
import { CalculatorPage } from './pages/Calculator';
import { DiaryPage } from './pages/DiaryPage';
import { LoginPage } from './pages/LoginPage';
import { MainPage } from './pages/MainPage';
import { SettingsPage } from './pages/SettingsPage';

function ChatPanel({ dataset }: { dataset: IRow[] | null }) {
  const { setIsOpen } = useRightPanel();

  return <Chat dataset={dataset} onClose={() => setIsOpen(false)} />;
}

const pageTitleKeys: Record<string, string> = {
  '/': 'nav.dashboard',
  '/dashboard': 'nav.dashboard',
  '/diary': 'nav.diary',
  '/calculator': 'nav.calculator',
  '/settings': 'nav.settings',
};

function AppRoutes() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
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

        <Route element={<Navigate replace to={'/login'} />} path={'*'} />
      </Routes>
    );
  }

  return (
    <RightPanelProvider>
      <SidebarProvider>
        <AppSidebar />

        <SidebarInset>
          <header
            className={'flex h-12 shrink-0 items-center gap-2 border-b px-4'}
          >
            <SidebarTrigger className={'-ml-1'} />

            <Separator className={'mr-2 h-4'} orientation={'vertical'} />

            <span className={'text-sm font-medium'}>{pageTitle}</span>
          </header>

          <div className={'flex-1 overflow-auto p-4'}>
            <Routes>
              <Route element={<MainPage />} path={'/'} />

              <Route element={<MainPage />} path={'/dashboard'} />

              <Route element={<DiaryPage />} path={'/diary'} />

              <Route element={<CalculatorPage />} path={'/calculator'} />

              <Route element={<SettingsPage />} path={'/settings'} />

              <Route element={<Navigate replace to={'/'} />} path={'/login'} />

              <Route element={<Navigate replace to={'/'} />} path={'*'} />
            </Routes>
          </div>

          <RightPanelTrigger className={'fixed right-6 bottom-6'}>
            <Button
              className={'h-14 w-14 rounded-full shadow-lg'}
              size={'icon'}
            >
              <MessageSquare className={'h-6 w-6'} />
            </Button>
          </RightPanelTrigger>
        </SidebarInset>

        <RightPanel>
          <ChatPanel dataset={dataSet} />
        </RightPanel>
      </SidebarProvider>
    </RightPanelProvider>
  );
}

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
          <AppRoutes />
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

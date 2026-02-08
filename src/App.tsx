import type { IRow } from './types/types';

import { Button } from '@components/ui/button';
import { ScrollArea } from '@components/ui/scroll-area';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@components/ui/sidebar';
import { Toaster } from '@components/ui/sonner';
import { CategoriesSettingsPage } from '@pages/settings/CategoriesSettingsPage';
import { DataSettingsPage } from '@pages/settings/DataSettingsPage';
import { PreferencesSettingsPage } from '@pages/settings/PreferencesSettingsPage';
import { ProfileSettingsPage } from '@pages/settings/ProfileSettingsPage';
import { MessageSquare } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { AppSidebar } from './components/AppSidebar';
import { Chat } from './components/Chat';
import { IOSInstallPrompt } from './components/IOSInstallPrompt';
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
import { useIsMobile } from './hooks/useMobile';
import { AdminPage } from './pages/AdminPage';
import { CalculatorPage } from './pages/Calculator';
import { CalendarPage } from './pages/CalendarPage';
import { ChatPage } from './pages/ChatPage';
import { DiaryPage } from './pages/DiaryPage';
import { LoginPage } from './pages/LoginPage';
import { MainPage } from './pages/MainPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';

const ChatPanel = ({ dataset }: { dataset: IRow[] | null }) => {
  return <Chat dataset={dataset} />;
};

const pageTitleKeys: Record<string, string> = {
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
  '/admin': 'nav.admin',
};

const AppRoutes = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const { preferences } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const { dataSet } = useDataSet();
  const isMobile = useIsMobile();

  const pageTitle = t(pageTitleKeys[location.pathname] || 'nav.dashboard');

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return (
      <ScrollArea className={'h-dvh'}>
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
      </ScrollArea>
    );
  }

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
                  disabled={location.pathname === '/chat'}
                  onClick={() => navigate('/chat')}
                  size={'icon'}
                  variant={'ghost'}
                >
                  <MessageSquare className={'h-4 w-4'} />
                </Button>
              ) : (
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
              )}
            </div>
          </header>

          {location.pathname === '/chat' ? (
            <div className={'flex min-h-0 flex-1 flex-col overflow-hidden'}>
              <Routes>
                <Route element={<ChatPage />} path={'/chat'} />
              </Routes>
            </div>
          ) : (
            <ScrollArea className={'min-h-0 flex-1'}>
              <Routes>
                <Route element={<MainPage />} path={'/'} />

                <Route element={<MainPage />} path={'/dashboard'} />

                <Route element={<DiaryPage />} path={'/diary'} />

                <Route element={<CalendarPage />} path={'/calendar'} />

                <Route element={<CalculatorPage />} path={'/calculator'} />

                <Route
                  element={<Navigate replace to={'/settings/profile'} />}
                  path={'/settings'}
                />

                <Route
                  element={<ProfileSettingsPage />}
                  path={'/settings/profile'}
                />

                <Route
                  element={<CategoriesSettingsPage />}
                  path={'/settings/categories'}
                />

                <Route
                  element={<PreferencesSettingsPage />}
                  path={'/settings/preferences'}
                />

                <Route element={<DataSettingsPage />} path={'/settings/data'} />

                <Route element={<AdminPage />} path={'/admin'} />

                <Route element={<PrivacyPage />} path={'/privacy'} />

                <Route element={<TermsPage />} path={'/terms'} />

                <Route
                  element={<Navigate replace to={'/'} />}
                  path={'/login'}
                />

                <Route element={<Navigate replace to={'/'} />} path={'*'} />
              </Routes>
            </ScrollArea>
          )}
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
            <IOSInstallPrompt />
            <Toaster />
          </DataProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

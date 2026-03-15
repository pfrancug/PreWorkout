import { AuthenticatedLayout } from '@components/AuthenticatedLayout';
import { Loader } from '@components/Loader';
import { TrainerRoute } from '@components/TrainerRoute';
import { ScrollArea } from '@components/ui/scroll-area';
import { useAuth } from '@contexts/useAuth';
import { AdminPage } from '@pages/AdminPage';
import { CalculatorPage } from '@pages/Calculator';
import { CalendarPage } from '@pages/CalendarPage';
import { ChatPage } from '@pages/ChatPage';
import { DiaryPage } from '@pages/DiaryPage';
import { LoginPage } from '@pages/LoginPage';
import { MainPage } from '@pages/MainPage';
import { PrivacyPage } from '@pages/PrivacyPage';
import { CategoriesSettingsPage } from '@pages/settings/CategoriesSettingsPage';
import { DataSettingsPage } from '@pages/settings/DataSettingsPage';
import { PreferencesSettingsPage } from '@pages/settings/PreferencesSettingsPage';
import { ProfileSettingsPage } from '@pages/settings/ProfileSettingsPage';
import { TermsPage } from '@pages/TermsPage';
import { TraineeViewPage } from '@pages/trainer/TraineeViewPage';
import { TrainerConnectedPage } from '@pages/trainer/TrainerConnectedPage';
import { TrainerConnectPage } from '@pages/trainer/TrainerConnectPage';
import { TrainerInvitesPage } from '@pages/trainer/TrainerInvitesPage';
import { TrainerSessionsPage } from '@pages/trainer/TrainerSessionsPage';
import { TrainerSharingPage } from '@pages/trainer/TrainerSharingPage';
import { Navigate, Route, Routes } from 'react-router-dom';

const UnauthenticatedRoutes = () => (
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

const AuthenticatedRoutes = () => (
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

    <Route element={<ProfileSettingsPage />} path={'/settings/profile'} />

    <Route element={<CategoriesSettingsPage />} path={'/settings/categories'} />

    <Route
      element={<PreferencesSettingsPage />}
      path={'/settings/preferences'}
    />

    <Route element={<DataSettingsPage />} path={'/settings/data'} />

    <Route element={<TrainerConnectPage />} path={'/trainer/connection'} />

    <Route element={<TrainerSessionsPage />} path={'/trainer/sessions'} />

    <Route
      path={'/trainer/invites'}
      element={
        <TrainerRoute>
          <TrainerInvitesPage />
        </TrainerRoute>
      }
    />

    <Route
      path={'/trainer/connected'}
      element={
        <TrainerRoute>
          <TrainerConnectedPage />
        </TrainerRoute>
      }
    />

    <Route element={<TrainerSharingPage />} path={'/trainer/sharing'} />

    <Route
      path={'/trainer/:traineeId'}
      element={
        <TrainerRoute>
          <TraineeViewPage />
        </TrainerRoute>
      }
    />

    <Route
      path={'/invite'}
      element={
        <Navigate replace to={`/trainer/connection${window.location.hash}`} />
      }
    />

    <Route
      element={<Navigate replace to={'/trainer/connection'} />}
      path={'/settings/trainer'}
    />

    <Route
      element={<Navigate replace to={'/trainer/connection'} />}
      path={'/trainer/connect'}
    />

    <Route element={<AdminPage />} path={'/admin'} />

    <Route element={<PrivacyPage />} path={'/privacy'} />

    <Route element={<TermsPage />} path={'/terms'} />

    <Route element={<Navigate replace to={'/'} />} path={'/login'} />

    <Route element={<Navigate replace to={'/'} />} path={'*'} />
  </Routes>
);

export const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return <UnauthenticatedRoutes />;
  }

  return (
    <AuthenticatedLayout
      chatContent={
        <Routes>
          <Route element={<ChatPage />} path={'/chat'} />
        </Routes>
      }
    >
      <AuthenticatedRoutes />
    </AuthenticatedLayout>
  );
};

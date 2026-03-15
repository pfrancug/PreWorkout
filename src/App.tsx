import { IOSInstallPrompt } from '@components/IOSInstallPrompt';
import { Toaster } from '@components/ui/sonner';
import { AuthProvider } from '@contexts/AuthProvider';
import { DataProvider } from '@contexts/DataProvider';
import { SettingsProvider } from '@contexts/SettingsProvider';
import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { AppRoutes } from './AppRoutes';

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

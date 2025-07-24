import { CssBaseline, ThemeProvider } from '@mui/material';
import { useEffect } from 'react';

import { AuthProvider } from './contexts/AuthProvider';
import { MainApp } from './core/MainApp';
import { theme } from './theme/theme';

const App = () => {
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
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

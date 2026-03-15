import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App.tsx';

import '@i18n';
import '@styles/globals.css';
// FullCalendar v6 injects its base styles via JS — no separate CSS imports
// needed. The slate theme below only overrides CSS custom properties.
import '@styles/fullcalendar-slate.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

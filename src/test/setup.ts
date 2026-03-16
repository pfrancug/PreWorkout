import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from '../i18n/locales/en';

import '@testing-library/jest-dom/vitest';

// jsdom does not implement scrollIntoView
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = () => {};
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

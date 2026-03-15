import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from './locales/en';
import { pl } from './locales/pl';

const resources = {
  en: { translation: en },
  pl: { translation: pl },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('i18nextLng') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export { i18n };

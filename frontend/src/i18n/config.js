import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

// Get saved language from localStorage or use browser language
const getSavedLanguage = () => {
  const savedLang = localStorage.getItem('preferredLanguage');
  if (savedLang && ['en', 'de'].includes(savedLang)) {
    return savedLang;
  }

  // Fallback to browser language
  const browserLang = navigator.language.split('-')[0];
  return ['en', 'de'].includes(browserLang) ? browserLang : 'en';
};

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'landing', 'auth', 'dashboard', 'recipe', 'collection', 'errors', 'pages'],

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: false, // Disable suspense to prevent flash of keys
    },

    // Preload all namespaces for selected language
    preload: ['en', 'de'],

    // Load all namespaces immediately
    load: 'currentOnly',
  });

// Listen for language changes and save to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('preferredLanguage', lng);
});

export default i18n;

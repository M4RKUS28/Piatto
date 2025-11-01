import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    common: null,
    landing: null,
    auth: null,
    dashboard: null,
    recipe: null,
    collection: null,
    errors: null,
  },
  de: {
    common: null,
    landing: null,
    auth: null,
    dashboard: null,
    recipe: null,
    collection: null,
    errors: null,
  },
};

// Function to load translations dynamically
const loadTranslations = async (language, namespace) => {
  try {
    const response = await fetch(`/locales/${language}/${namespace}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${language}/${namespace}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`Translation file not found: ${language}/${namespace}.json`, error);
    return {};
  }
};

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
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'landing', 'auth', 'dashboard', 'recipe', 'collection', 'errors'],

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: true,
    },

    // Load translations on demand
    partialBundledLanguages: true,
  });

// Load all namespaces for the current language
const loadLanguage = async (language) => {
  const namespaces = ['common', 'landing', 'auth', 'dashboard', 'recipe', 'collection', 'errors'];

  for (const namespace of namespaces) {
    const translations = await loadTranslations(language, namespace);
    i18n.addResourceBundle(language, namespace, translations, true, true);
  }
};

// Load initial language
loadLanguage(i18n.language);

// Listen for language changes and save to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('preferredLanguage', lng);
  loadLanguage(lng);
});

export default i18n;

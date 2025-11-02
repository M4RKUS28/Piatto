import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Eagerly bundle every locale JSON so Vite ships translations with the app
const translationModules = import.meta.glob('./locales/*/*.json', {
  eager: true,
  import: 'default',
});

const namespaceSet = new Set();

const resources = Object.entries(translationModules).reduce((acc, [path, value]) => {
  const normalizedPath = path.replaceAll('\\', '/');
  const segments = normalizedPath.split('/');
  const language = segments[2];
  const namespace = segments[3].replace('.json', '');

  if (!language || !namespace) {
    return acc;
  }

  acc[language] ??= {};
  acc[language][namespace] = value;
  namespaceSet.add(namespace);

  return acc;
}, {});

const supportedLngs = Object.keys(resources).length ? Object.keys(resources) : ['en'];
const namespaces = Array.from(namespaceSet);

if (!namespaceSet.size) {
  namespaces.push('common');
}

const i18nInstance = i18n.createInstance();

i18nInstance
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs,
    ns: namespaces,
    defaultNS: 'common',
    load: 'currentOnly',
    debug: import.meta.env.DEV,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18nInstance;

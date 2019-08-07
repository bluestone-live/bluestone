import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

export enum I18nLanguages {
  Chinese = 'zh',
  English = 'en',
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: require('./translations/zh.json').translations },
      en: { translation: require('./translations/en.json').translations },
    },
    lng: 'en',
    fallbackLng: 'en',
    ns: ['translations'],
    debug: process.env.NODE_ENV !== 'production',
    react: {
      wait: true,
    },
  });

export default i18n;

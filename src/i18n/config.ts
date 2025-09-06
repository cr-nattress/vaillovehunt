import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import en from './locales/en.json'
import es from './locales/es.json'

const resources = {
  en: { translation: en },
  es: { translation: es }
}

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    
    // Default language
    fallbackLng: 'en',
    
    // Debug mode (disable in production)
    debug: import.meta.env.DEV,
    
    // Language detection options
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // Cache user selection
      caches: ['localStorage'],
      
      // Keys to use for localStorage
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      // React already does escaping
      escapeValue: false,
    },

    // Default namespace
    defaultNS: 'translation',
    
    // React options
    react: {
      // Use Suspense for async loading
      useSuspense: false
    }
  })

export default i18n
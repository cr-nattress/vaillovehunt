import React from 'react'
import { useTranslation } from 'react-i18next'

interface LanguageSwitcherProps {
  className?: string
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }
]

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation()

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode)
  }

  return (
    <div className={`relative ${className}`}>
      <label htmlFor="language-select" className="sr-only">
        {t('language.select')}
      </label>
      <select
        id="language-select"
        value={i18n.language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="px-3 py-2 pr-8 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-transparent"
        style={{
          color: 'var(--color-dark-neutral)',
          borderColor: 'var(--color-light-grey)',
          focusRingColor: 'var(--color-cabernet)'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--color-cabernet)'
          e.target.style.boxShadow = '0 0 0 2px rgba(85, 36, 72, 0.2)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--color-light-grey)'
          e.target.style.boxShadow = 'none'
        }}
        aria-label={t('language.select')}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      
      {/* Custom dropdown arrow */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  )
}
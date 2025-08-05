'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage()

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
      title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
    >
      <span className="text-lg">
        {language === 'en' ? '🇺🇸' : '🇪🇸'}
      </span>
      <span className="hidden sm:inline">
        {language === 'en' ? 'EN' : 'ES'}
      </span>
    </button>
  )
}
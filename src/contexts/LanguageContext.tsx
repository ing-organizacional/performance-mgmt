/**
 * Language Context Provider
 * 
 * Provides bilingual support throughout the application with:
 * - Dynamic language switching between English and Spanish
 * - Persistent language preference in localStorage
 * - Type-safe translations with complete TypeScript support
 * - 290+ translation keys covering all application features
 * - Seamless integration with all UI components
 * - Real-time language updates without page refresh
 */

'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Language, translations, Translations } from '@/lib/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
  toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      setLanguageState(savedLanguage)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'es' : 'en'
    setLanguage(newLang)
  }

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
    toggleLanguage
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
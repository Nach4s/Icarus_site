import React, { createContext, useContext, useState, useEffect } from 'react'
import translations from './translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  // Read from localStorage or default to 'en'
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('icarus_lang') || 'en'
  })

  // Whenever language changes, save to localStorage and update document lang attribute
  useEffect(() => {
    localStorage.setItem('icarus_lang', lang)
    document.documentElement.lang = lang
  }, [lang])

  // Translation function
  const t = (key) => {
    const item = translations[key]
    if (!item) {
      console.warn(`Translation key not found: ${key}`)
      return key
    }
    return item[lang] || item['en'] || key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLang must be used within a LanguageProvider')
  }
  return context
}

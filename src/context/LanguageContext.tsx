import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from '../config/translation';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Read initial language from localStorage or fallback to Marathi as default (since RA Masala is a Maharashtrian brand) or English
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_lang');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_lang', lang);
    // Dispatch a custom event to notify other parts of the app if needed
    window.dispatchEvent(new Event('languageChange'));
  };

  const t = (key: keyof typeof translations['en']): string => {
    const langData = translations[language] || translations['en'];
    return langData[key] || translations['en'][key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

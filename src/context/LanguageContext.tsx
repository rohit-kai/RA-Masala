import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from '../config/translation';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en'] | string) => string;
  tp: (productName: string) => string;
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

  const t = (key: keyof typeof translations['en'] | string): string => {
    const langData = (translations[language] || translations['en']) as Record<string, string>;
    const enData = translations['en'] as Record<string, string>;
    return langData[key] || enData[key] || String(key);
  };

  // Translate a DB product/DB value by matching its English name to a known product key.
  // Falls back to the original value when there is no known translation.
  const tp = (value: string): string => {
    if (!value) return value;
    const en = translations['en'] as Record<string, string>;
    const lang = (translations[language] || translations['en']) as Record<string, string>;
    const match = Object.keys(en).find((k) => en[k] === value && /^p\d+_(name|desc)$/.test(k));
    if (match && lang[match]) return lang[match];
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tp }}>
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

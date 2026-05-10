import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (en: string, hi?: string) => string; // Translation helper
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  toggleLanguage: () => {},
  setLanguage: () => {},
  t: (en) => en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage, default to 'en'
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ymi-language') as Language | null;
      if (stored === 'hi' || stored === 'en') return stored;
    }
    return 'en';
  });

  // Persist to localStorage whenever language changes
  useEffect(() => {
    localStorage.setItem('ymi-language', language);
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'en' ? 'hi' : 'en'));
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback(
    (en: string, hi?: string) => {
      if (language === 'hi' && hi) return hi;
      return en;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);

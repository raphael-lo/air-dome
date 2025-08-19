
import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import type { Site, Language, Theme } from '../backend/src/types';
import { SITES, TRANSLATIONS } from '../constants';

interface AppContextType {
  sites: Site[];
  selectedSite: Site;
  setSelectedSite: (site: Site) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedSite, setSelectedSite] = useState<Site>(SITES[0]);

  // Load language from localStorage or default to 'en'
  const [language, setLanguage] = useState<Language>(() => {
    const storedLang = localStorage.getItem('app-language');
    return (storedLang === 'en' || storedLang === 'zh') ? storedLang : 'en';
  });

  // Load theme from localStorage or default to 'light'
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('app-theme');
    return (storedTheme === 'light' || storedTheme === 'dark') ? storedTheme : 'light';
  });

  // Effect to update DOM and localStorage when theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // Effect to update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('app-language', language);
  }, [language]);

  const t = useMemo(() => {
    return (key: string, params?: Record<string, any>): string => {
      let translation = TRANSLATIONS[language][key] || key;
      if (params) {
        for (const paramKey in params) {
          translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), params[paramKey]);
        }
      }
      return translation;
    };
  }, [language]);

  const value = {
    sites: SITES,
    selectedSite,
    setSelectedSite,
    language,
    setLanguage,
    theme,
    setTheme,
    t,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};

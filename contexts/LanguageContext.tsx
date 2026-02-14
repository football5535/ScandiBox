
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { translations } from '../utils/translations';
import { userService } from '../services/supabaseService';
import { Language } from '../types';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load initial language preference
    userService.getProfile().then(p => {
        if (p && p.preferences.language) {
            setLanguageState(p.preferences.language);
        }
    });
  }, []);

  const setLanguage = async (lang: Language) => {
      setLanguageState(lang);
      // Persist to DB
      await userService.updateProfile({ language: lang });
  };

  const t = (path: string) => {
    const keys = path.split('.');
    let value: any = translations[language];
    for (const key of keys) {
      if (value && value[key]) {
        value = value[key];
      } else {
        return path; // Fallback to key if not found
      }
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

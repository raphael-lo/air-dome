
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { SiteIcon, LanguageIcon } from './icons/NavIcons';
import type { View } from '../backend/src/types';

interface HeaderProps {
  currentView: View;
}

export const Header: React.FC<HeaderProps> = ({ currentView }) => {
  const { sites, selectedSite, setSelectedSite, language, setLanguage, t } = useAppContext();

  return (
    <header className="flex-shrink-0 bg-white dark:bg-brand-dark border-b border-gray-200 dark:border-brand-dark-lightest px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-brand-text">{t(selectedSite.nameKey)} - {t(currentView)}</h1>
        </div>
        <div className="flex items-center space-x-4">
          {/* Site Selector */}
          <div className="relative">
             <SiteIcon className="hidden absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-brand-text-dim" />
             <select
                value={selectedSite.id}
                onChange={(e) => {
                  const newSite = sites.find(s => s.id === e.target.value);
                  if (newSite) setSelectedSite(newSite);
                }}
                className="hidden pl-10 pr-4 py-2 bg-gray-100 dark:bg-brand-dark-light border border-gray-300 dark:border-brand-dark-lightest rounded-md text-gray-900 dark:text-brand-text focus:ring-2 focus:ring-brand-accent focus:outline-none appearance-none"
             >
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{t(site.nameKey)}</option>
                ))}
             </select>
          </div>

          {/* Language Switcher */}
          <div className="relative">
             <LanguageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-brand-text-dim" />
             <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'zh')}
                className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-brand-dark-light border border-gray-300 dark:border-brand-dark-lightest rounded-md text-gray-900 dark:text-brand-text focus:ring-2 focus:ring-brand-accent focus:outline-none appearance-none"
             >
                <option value="en">{t('english')}</option>
                <option value="zh">{t('traditional_chinese')}</option>
             </select>
          </div>
        </div>
      </div>
    </header>
  );
};
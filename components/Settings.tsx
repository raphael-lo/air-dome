
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { SettingsIcon } from './icons/NavIcons';
import { SunIcon, MoonIcon } from './icons/ThemeIcons';


export const Settings: React.FC = () => {
    const { language, setLanguage, theme, setTheme, t } = useAppContext();

    return (
        <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-lg p-6 max-w-lg mx-auto">
            <div className="flex items-center mb-6">
                <SettingsIcon className="h-8 w-8 text-brand-accent mr-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-brand-text">{t('settings')}</h2>
            </div>
            
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-text mb-2">{t('language_settings')}</h3>
                    <div className="flex space-x-4">
                        <button 
                            onClick={() => setLanguage('en')}
                            className={`py-2 px-4 rounded-lg transition-colors w-full ${language === 'en' ? 'bg-brand-accent text-white' : 'bg-gray-100 dark:bg-brand-dark text-gray-700 dark:text-brand-text-dim'}`}
                        >
                            {t('english')}
                        </button>
                        <button 
                            onClick={() => setLanguage('zh')}
                            className={`py-2 px-4 rounded-lg transition-colors w-full ${language === 'zh' ? 'bg-brand-accent text-white' : 'bg-gray-100 dark:bg-brand-dark text-gray-700 dark:text-brand-text-dim'}`}
                        >
                            {t('traditional_chinese')}
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-text mb-2">Theme</h3>
                    <div className="flex space-x-4">
                        <button 
                            onClick={() => setTheme('light')}
                            className={`py-2 px-4 rounded-lg transition-colors w-full flex items-center justify-center gap-2 ${theme === 'light' ? 'bg-brand-accent text-white' : 'bg-gray-100 dark:bg-brand-dark text-gray-700 dark:text-brand-text-dim'}`}
                        >
                            <SunIcon className="h-5 w-5" />
                            Light
                        </button>
                        <button 
                            onClick={() => setTheme('dark')}
                            className={`py-2 px-4 rounded-lg transition-colors w-full flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-brand-accent text-white' : 'bg-gray-100 dark:bg-brand-dark text-gray-700 dark:text-brand-text-dim'}`}
                        >
                             <MoonIcon className="h-5 w-5" />
                            Dark
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import type { View } from '../types';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS } from '../constants';
import { DomeIcon, LogoutIcon } from './icons/NavIcons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { t } = useAppContext();
  const { logout } = useAuth();

  const mainNavItems = NAV_ITEMS.filter(item => item.id !== 'emergency');
  const emergencyNavItem = NAV_ITEMS.find(item => item.id === 'emergency');

  return (
    <div className="flex flex-col items-center w-20 bg-white dark:bg-brand-dark border-r border-gray-200 dark:border-brand-dark-lightest p-4">
      <div className="flex-shrink-0 text-brand-accent">
        <DomeIcon className="h-10 w-10" />
      </div>
      <nav className="flex flex-col justify-between h-full w-full mt-8">
        <div className="flex flex-col items-center space-y-6">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`p-3 rounded-lg transition-colors duration-200 group relative ${
                currentView === item.id
                  ? 'bg-brand-accent text-white'
                  : 'text-gray-500 dark:text-brand-text-dim hover:bg-gray-100 dark:hover:bg-brand-dark-light hover:text-gray-900 dark:hover:text-brand-text'
              }`}
              aria-label={t(item.id)}
            >
              <item.icon className="h-6 w-6" />
              <span className="absolute left-full ml-4 w-auto p-2 min-w-max rounded-md shadow-md text-white bg-gray-700 dark:bg-brand-dark-lightest text-xs font-bold transition-all duration-100 scale-0 origin-left group-hover:scale-100">
                {t(item.id)}
              </span>
            </button>
          ))}
        </div>
        
        <div className="flex flex-col items-center space-y-4">
           {emergencyNavItem && (
              <button
                key={emergencyNavItem.id}
                onClick={() => setCurrentView(emergencyNavItem.id)}
                className={`p-3 rounded-lg transition-colors duration-200 group relative ${
                  currentView === emergencyNavItem.id
                    ? 'bg-status-danger text-white'
                    : 'text-status-danger hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40'
                }`}
                aria-label={t(emergencyNavItem.id)}
              >
                <emergencyNavItem.icon className="h-6 w-6" />
                <span className="absolute left-full ml-4 w-auto p-2 min-w-max rounded-md shadow-md text-white bg-gray-700 dark:bg-brand-dark-lightest text-xs font-bold transition-all duration-100 scale-0 origin-left group-hover:scale-100">
                  {t(emergencyNavItem.id)}
                </span>
              </button>
           )}
           <button
              onClick={logout}
              className="p-3 rounded-lg text-gray-500 dark:text-brand-text-dim hover:bg-gray-100 dark:hover:bg-brand-dark-light hover:text-gray-900 dark:hover:text-brand-text transition-colors duration-200 group relative"
              aria-label={t('logout')}
           >
                <LogoutIcon className="h-6 w-6" />
                 <span className="absolute left-full ml-4 w-auto p-2 min-w-max rounded-md shadow-md text-white bg-gray-700 dark:bg-brand-dark-lightest text-xs font-bold transition-all duration-100 scale-0 origin-left group-hover:scale-100">
                  {t('logout')}
                </span>
           </button>
        </div>
      </nav>
    </div>
  );
};

import React from 'react';
import { ChevronDownIcon } from './icons/MetricIcons';

interface MetricGroupProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  icon?: React.ReactElement<{ className?: string }>;
}

export const MetricGroup: React.FC<MetricGroupProps> = ({ title, children, isOpen, onToggle, icon }) => {
  const id = title.replace(/\s+/g, '-').toLowerCase();

  return (
    <section aria-labelledby={id} className="bg-white dark:bg-brand-dark-light rounded-lg shadow-md transition-all duration-300">
      <button
        id={id}
        onClick={onToggle}
        className="w-full flex justify-between items-center p-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-inset rounded-lg"
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          {icon && React.cloneElement(icon, { className: 'h-6 w-6 mr-2 text-brand-accent' })}
          <h3 className="text-xl font-semibold text-gray-800 dark:text-brand-text">
            {title}
          </h3>
        </div>
        <ChevronDownIcon className={`h-6 w-6 text-gray-500 dark:text-brand-text-dim transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div 
        className={`grid overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
            <div className={`p-4 pt-2 ${isOpen ? 'border-t border-gray-200 dark:border-brand-dark-lightest' : ''}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                    {children}
                </div>
            </div>
        </div>
      </div>
    </section>
  );
};
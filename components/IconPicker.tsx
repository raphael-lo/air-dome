import React from 'react';
import * as MetricIcons from './icons/MetricIcons';

interface IconPickerProps {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelectIcon }) => {
  const iconOptions = Object.keys(MetricIcons);

  return (
    <div className="grid grid-cols-6 gap-4">
      {iconOptions.map(iconName => {
        const IconComponent = MetricIcons[iconName as keyof typeof MetricIcons];
        const isSelected = selectedIcon === iconName;
        return (
          <div 
            key={iconName} 
            onClick={() => onSelectIcon(iconName)} 
            className={`p-2 rounded-lg cursor-pointer flex items-center justify-center ${isSelected ? 'bg-brand-accent text-white' : 'bg-gray-200 dark:bg-brand-dark-lightest'}`}>
            <IconComponent className="h-8 w-8" />
          </div>
        );
      })}
    </div>
  );
};
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { BulbIcon, ShutdownIcon } from './icons/MetricIcons';

interface LightingControlCardProps {
  lightsOn: boolean;
  onPowerToggle: () => void;
  brightness: number;
  onBrightnessChange: (value: number) => void;
}

export const LightingControlCard: React.FC<LightingControlCardProps> = ({ lightsOn, onPowerToggle, brightness, onBrightnessChange }) => {
    const { t } = useAppContext();
    const { user } = useAuth();

    if (user?.role === 'Viewer') {
        return null;
    }

    return (
        <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-lg p-4 flex flex-col space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-8">
                    <BulbIcon className={`h-20 w-20 transition-colors ${lightsOn ? 'text-yellow-400' : 'text-gray-400 dark:text-brand-dark-lightest'}`}/>
                    <h2 className="text-3xl font-semibold text-gray-800 dark:text-brand-text">{t('main_lighting')} (Demo)</h2>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${!lightsOn ? 'bg-gray-500 text-white' : 'bg-status-ok text-white'}`}>
                    {!lightsOn ? t('off') : t('on')}
                </span>
            </div>

            {/* Controls */}
            <div className="space-y-4">
                <div className="space-y-1">
                    <div className="flex justify-between items-baseline text-sm">
                        <span className="font-medium text-gray-600 dark:text-brand-text-dim">{t('brightness')}</span>
                        <span className="font-bold text-gray-800 dark:text-brand-text">{brightness}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={brightness}
                        onChange={(e) => onBrightnessChange(Number(e.target.value))}
                        disabled={!lightsOn}
                        className={`w-full h-2 bg-gray-200 dark:bg-brand-dark-lightest rounded-lg appearance-none cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${lightsOn ? 'accent-brand-accent' : ''}`}
                    />
                </div>
            </div>
            
            {/* Footer Action */}
            <div className="pt-2">
                 <button
                    onClick={onPowerToggle}
                    className={`w-full text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${!lightsOn ? 'bg-status-ok hover:bg-green-600' : 'bg-status-danger hover:bg-red-600'}`}
                >
                    <ShutdownIcon className="h-5 w-5" />
                    {!lightsOn ? t('power_on_lights') : t('power_off_lights')}
                </button>
            </div>
        </div>
    );
};
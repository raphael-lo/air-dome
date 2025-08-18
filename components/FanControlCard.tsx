import React from 'react';
import { useAppContext } from '../context/AppContext';
import type { FanSet } from '../backend/src/types';
import { FanIcon, ShutdownIcon } from './icons/MetricIcons';

interface FanControlCardProps {
  fanSet: FanSet;
  onUpdate: (id: string, updates: Partial<Omit<FanSet, 'id' | 'name'>>) => void;
}

import { useAuth } from '../context/AuthContext';

const ControlSlider: React.FC<{ label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled: boolean; }> = ({ label, value, onChange, disabled }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-baseline text-sm">
      <span className="font-medium text-gray-600 dark:text-brand-text-dim">{label}</span>
      <span className="font-bold text-gray-800 dark:text-brand-text">{value}%</span>
    </div>
    <input
      type="range"
      min="0"
      max="100"
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full h-2 bg-gray-200 dark:bg-brand-dark-lightest rounded-lg appearance-none cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${!disabled ? 'accent-status-ok' : ''}`}
    />
  </div>
);

export const FanControlCard: React.FC<FanControlCardProps> = ({ fanSet, onUpdate }) => {
  const { t } = useAppContext();
  const { user } = useAuth();
  const isOff = fanSet.status === 'off';
  const isManual = fanSet.mode === 'manual';
  const slidersDisabled = isOff || !isManual;

  const handleModeToggle = () => {
    onUpdate(fanSet.id, { mode: isManual ? 'auto' : 'manual' });
  };

  const handlePowerToggle = () => {
      onUpdate(fanSet.id, { status: isOff ? 'on' : 'off' })
  }

  if (user?.role === 'Viewer') {
    return null;
  }

  return (
    <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-lg p-4 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
                <FanIcon className={`h-20 w-20 text-brand-accent ${!isOff ? 'animate-spin-slow' : ''}`}/>
                <h2 className="text-3xl font-semibold text-gray-800 dark:text-brand-text">{fanSet.name} (Demo)</h2>
            </div>
            <span className={`px-2 py-1 text-xs font-bold rounded-full ${isOff ? 'bg-gray-500 text-white' : 'bg-status-ok text-white'}`}>
                {isOff ? t('off') : t('running')}
            </span>
        </div>

        {/* Controls */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="font-medium text-gray-500 dark:text-brand-text-dim">{t('mode')}</span>
                 <div className="flex items-center">
                    <span className={`mr-3 font-bold text-sm ${!isManual ? 'text-brand-accent' : 'text-gray-500 dark:text-brand-text-dim'}`}>{t('auto')}</span>
                    <button 
                        onClick={handleModeToggle} 
                        disabled={isOff}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isManual ? 'bg-brand-accent' : 'bg-gray-200 dark:bg-brand-dark-lightest'}`}
                    >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isManual ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className={`ml-3 font-bold text-sm ${isManual ? 'text-brand-accent' : 'text-gray-500 dark:text-brand-text-dim'}`}>{t('manual')}</span>
                </div>
            </div>

            <ControlSlider
                label={t('inflow_volume')}
                value={fanSet.inflow}
                onChange={e => onUpdate(fanSet.id, { inflow: Number(e.target.value) })}
                disabled={slidersDisabled}
            />

            <ControlSlider
                label={t('outflow_volume')}
                value={fanSet.outflow}
                onChange={e => onUpdate(fanSet.id, { outflow: Number(e.target.value) })}
                disabled={slidersDisabled}
            />
        </div>
        
        {/* Footer Action */}
        <div className="pt-2">
             <button
                onClick={handlePowerToggle}
                className={`w-full text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${isOff ? 'bg-status-ok hover:bg-green-600' : 'bg-status-danger hover:bg-red-600'}`}
            >
                <ShutdownIcon className="h-5 w-5" />
                {isOff ? t('power_on_fan') : t('shutdown_fan')}
            </button>
        </div>
    </div>
  );
};
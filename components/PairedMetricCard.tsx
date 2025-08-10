import React from 'react';
import { StatusLevel } from '../types';
import { useAppContext } from '../context/AppContext';

interface MetricData {
  value: string | number;
  status: StatusLevel;
}

interface PairedMetricCardProps {
  titleKey: string;
  icon: React.ReactElement<{ className?: string }>;
  internalData: MetricData;
  externalData: MetricData;
  unit: string;
  onClick?: () => void;
}

const statusColors = {
  ok: 'bg-status-ok',
  warn: 'bg-status-warn',
  danger: 'bg-status-danger',
};

const statusTextColors = {
  ok: 'text-status-ok',
  warn: 'text-yellow-500 dark:text-status-warn',
  danger: 'text-status-danger',
};

const getCombinedStatus = (s1: StatusLevel, s2: StatusLevel): StatusLevel => {
  if (s1 === StatusLevel.Danger || s2 === StatusLevel.Danger) return StatusLevel.Danger;
  if (s1 === StatusLevel.Warn || s2 === StatusLevel.Warn) return StatusLevel.Warn;
  return StatusLevel.Ok;
};

const DataRow: React.FC<{ label: string; data: MetricData; unit: string }> = ({ label, data, unit }) => {
    const textColorClass = statusTextColors[data.status] || 'text-gray-900 dark:text-brand-text';
    return (
        <div className="flex justify-between items-baseline">
            <span className="text-sm font-medium text-gray-600 dark:text-brand-text-dim">{label}</span>
            <p className={`text-xl font-bold ${textColorClass} transition-colors`}>
                {data.value} <span className="text-sm font-medium text-gray-500 dark:text-brand-text-dim">{unit}</span>
            </p>
        </div>
    );
};


export const PairedMetricCard: React.FC<PairedMetricCardProps> = ({ titleKey, icon, internalData, externalData, unit, onClick }) => {
  const { t } = useAppContext();
  const combinedStatus = getCombinedStatus(internalData.status, externalData.status);
  const colorClass = statusColors[combinedStatus] || 'bg-gray-400';
  const isClickable = !!onClick;

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`bg-white dark:bg-brand-dark-light rounded-lg shadow p-4 flex flex-col justify-between relative overflow-hidden text-left w-full
        ${isClickable ? 'transition-transform transform hover:-translate-y-1 cursor-pointer' : 'cursor-default'}
        focus:outline-none focus:ring-2 focus:ring-brand-accent`
      }
    >
        <div>
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-800 dark:text-brand-text">{t(titleKey)}</h3>
                </div>
                <div className="text-brand-accent-light opacity-50 dark:opacity-30">
                {React.cloneElement(icon, { className: 'h-8 w-8' })}
                </div>
            </div>

            <div className="space-y-2 mt-2">
                <DataRow label={t('internal')} data={internalData} unit={unit} />
                <DataRow label={t('external')} data={externalData} unit={unit} />
            </div>
        </div>
      
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${colorClass} mt-4`}></div>
    </button>
  );
};
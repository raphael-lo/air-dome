import React from 'react';
import type { StatusLevel } from '../types';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  status: StatusLevel;
  icon: React.ReactElement<{ className?: string }>;
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

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, status, icon, onClick }) => {
  const colorClass = statusColors[status] || 'bg-gray-400';
  const textColorClass = statusTextColors[status] || 'text-gray-900 dark:text-brand-text';

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
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 dark:text-brand-text-dim">{title}</h3>
          <p className={`text-3xl font-bold mt-2 ${textColorClass} transition-colors`}>
            {value} <span className="text-lg font-medium text-gray-500 dark:text-brand-text-dim">{unit}</span>
          </p>
        </div>
        <div className="text-brand-accent-light opacity-50 dark:opacity-30">
          {React.cloneElement(icon, { className: 'h-8 w-8' })}
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${colorClass}`}></div>
    </button>
  );
};
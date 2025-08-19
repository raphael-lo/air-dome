
import React, { useState, useEffect } from 'react';
import type { Alert } from '../backend/src/types';
import { useAppContext } from '../context/AppContext';
import { SeverityBadge } from './SeverityBadge';
import { fetchAlerts, acknowledgeAlert } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { SpinnerIcon } from './icons/MetricIcons';

export const Alerts: React.FC = () => {
    const { selectedSite, t } = useAppContext();
    const { authenticatedFetch } = useAuth();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
    const [lastLoadedTime, setLastLoadedTime] = useState<Date | null>(null);

    useEffect(() => {
        const loadAlerts = async () => {
            setIsLoading(true);
            const siteAlerts = await fetchAlerts(selectedSite.id, { authenticatedFetch });
            const sortedAlerts = siteAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setAlerts(sortedAlerts);
            setLastLoadedTime(new Date()); // Set current time as last loaded time
            setIsLoading(false);
        };
        loadAlerts();
    }, [selectedSite, authenticatedFetch]);

    const handleAcknowledge = async (alertId: string) => {
        setAcknowledgingId(alertId);
        await acknowledgeAlert(alertId, { authenticatedFetch });
        // Refetch alerts to get the updated status
        const updatedAlerts = await fetchAlerts(selectedSite.id, { authenticatedFetch });
        setAlerts(updatedAlerts);
        setAcknowledgingId(null);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full p-6 bg-white dark:bg-brand-dark-light rounded-lg shadow-lg">
                 <SpinnerIcon className="h-10 w-10 text-brand-accent animate-spin" />
            </div>
        );
    }
    
  return (
    <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-brand-text mb-4">{t('alerts_page_title')}</h2>
      {lastLoadedTime && (
        <p className="text-sm text-gray-500 dark:text-brand-text-dim mb-4">
          {t('last_updated')}: {lastLoadedTime.toLocaleString()}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 dark:border-brand-dark-lightest">
              <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">{t('severity')}</th>
              <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">{t('parameter')}</th>
              <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">{t('message')}</th>
              <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">{t('timestamp')}</th>
              <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">{t('status')}</th>
              <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim text-center">{t('action')}</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map(alert => (
              <tr key={alert.id} className="border-b border-gray-200 dark:border-brand-dark-lightest hover:bg-gray-50 dark:hover:bg-brand-dark transition-colors">
                <td className="p-3"><SeverityBadge severity={alert.severity} /></td>
                <td className="p-3 text-gray-800 dark:text-brand-text">{t(alert.parameter_key)}</td>
                <td className="p-3 text-gray-800 dark:text-brand-text">{t(alert.message_key, alert.message_params)}</td>
                <td className="p-3 text-gray-500 dark:text-brand-text-dim">{new Date(alert.timestamp).toLocaleString()}</td>
                <td className="p-3 text-gray-800 dark:text-brand-text capitalize">{t(alert.status)}</td>
                <td className="p-3 text-center">
                    {alert.status === 'active' && (
                        <button 
                            onClick={() => handleAcknowledge(alert.id)}
                            disabled={acknowledgingId === alert.id}
                            className="bg-brand-accent hover:bg-brand-accent-light text-white font-bold py-1 px-3 rounded-lg text-sm transition-colors w-28 h-7 flex justify-center items-center disabled:opacity-50 disabled:cursor-wait"
                        >
                            {acknowledgingId === alert.id ? <SpinnerIcon className="h-4 w-4 animate-spin"/> : t('acknowledge')}
                        </button>
                    )}
                </td>
              </tr>
            ))}
             {alerts.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center p-6 text-gray-500 dark:text-brand-text-dim">{t('no_active_alerts')}</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { SpinnerIcon } from './icons/MetricIcons';

interface AlertThreshold {
  id?: string;
  siteId: string;
  metricName: string;
  minWarning: number;
  maxWarning: number;
  minAlert: number;
  maxAlert: number;
}

const metricNames = [
  'internalPressure',
  'externalPressure',
  'fanSpeed',
  'airExchangeRate',
  'powerConsumption',
  'voltage',
  'current',
  'externalWindSpeed',
  'internalPM25',
  'externalPM25',
  'internalCO2',
  'externalCO2',
  'internalO2',
  'externalO2',
  'internalCO',
  'externalCO',
  'internalTemperature',
  'externalTemperature',
  'internalHumidity',
  'externalHumidity',
  'internalNoise',
  'externalNoise',
  'basePressure',
  'internalLux',
  'lightingStatus',
  'airShutterStatus',
];

export const AlertSetting: React.FC = () => {
  const { selectedSite, t } = useAppContext();
  const { authenticatedFetch } = useAuth();
  const [thresholds, setThresholds] = useState<Record<string, AlertThreshold>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<'' | 'success' | 'error' | 'saving' | 'loading' >('loading');

  useEffect(() => {
    const fetchThresholds = async () => {
      setIsLoading(true);
      setSaveMessage('loading');
      try {
        const response = await authenticatedFetch(`/api/alert-thresholds/${selectedSite.id}`);
        if (!response.ok) throw new Error('Failed to fetch thresholds');
        const data: AlertThreshold[] = await response.json();
        const mappedThresholds: Record<string, AlertThreshold> = {};
        data.forEach(th => {
          mappedThresholds[th.metricName] = th;
        });
        setThresholds(mappedThresholds);
        setSaveMessage('');
      } catch (error) {
        console.error("Error fetching thresholds:", error);
        setSaveMessage('error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchThresholds();
  }, [selectedSite, authenticatedFetch]);

  const handleChange = (metricName: string, field: keyof AlertThreshold, value: number | string) => {
    setThresholds(prev => ({
      ...prev,
      [metricName]: {
        ...prev[metricName],
        siteId: selectedSite.id,
        metricName: metricName,
        [field]: value,
      },
    }));
  };

  const handleSave = async (metricName: string) => {
    setIsSaving(true);
    setSaveMessage('saving');
    const threshold = thresholds[metricName];
    if (!threshold) return;

    try {
      const response = await authenticatedFetch(`/api/alert-thresholds/${selectedSite.id}/${metricName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(threshold),
      });
      if (!response.ok) throw new Error('Failed to save threshold');
      setSaveMessage('success');
    } catch (error) {
      console.error("Error saving threshold:", error);
      setSaveMessage('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000); // Clear message after 3 seconds
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <SpinnerIcon className="h-12 w-12 text-brand-accent animate-spin" />
        <p className="text-lg text-gray-600 dark:text-brand-text-dim ml-4">{t('loading_thresholds')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-brand-text">{t('alert_settings')}</h1>
      <p className="text-gray-600 dark:text-brand-text-dim">{t('alert_settings_description')}</p>

      {saveMessage === 'success' && <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4">{t('save_success')}</div>}
      {saveMessage === 'error' && <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4">{t('save_error')}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricNames.map(metricName => {
          const currentThreshold = thresholds[metricName] || { 
            siteId: selectedSite.id, 
            metricName: metricName, 
            minWarning: 0, maxWarning: 0, 
            minAlert: 0, maxAlert: 0 
          };
          return (
            <div key={metricName} className="bg-white dark:bg-brand-dark-light rounded-lg shadow-lg p-4 space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-brand-text capitalize">{t(metricName)}</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-brand-text-dim">{t('min_warning')}</label>
                <input
                  type="number"
                  value={currentThreshold.minWarning}
                  onChange={e => handleChange(metricName, 'minWarning', Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent dark:bg-brand-dark-lightest dark:border-brand-dark-lightest dark:text-brand-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-brand-text-dim">{t('max_warning')}</label>
                <input
                  type="number"
                  value={currentThreshold.maxWarning}
                  onChange={e => handleChange(metricName, 'maxWarning', Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent dark:bg-brand-dark-lightest dark:border-brand-dark-lightest dark:text-brand-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-brand-text-dim">{t('min_alert')}</label>
                <input
                  type="number"
                  value={currentThreshold.minAlert}
                  onChange={e => handleChange(metricName, 'minAlert', Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent dark:bg-brand-dark-lightest dark:border-brand-dark-lightest dark:text-brand-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-brand-text-dim">{t('max_alert')}</label>
                <input
                  type="number"
                  value={currentThreshold.maxAlert}
                  onChange={e => handleChange(metricName, 'maxAlert', Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent dark:bg-brand-dark-lightest dark:border-brand-dark-lightest dark:text-brand-text"
                />
              </div>
              <button
                onClick={() => handleSave(metricName)}
                disabled={isSaving}
                className="w-full bg-brand-accent hover:bg-brand-accent-light text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSaving ? t('saving') : t('save')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

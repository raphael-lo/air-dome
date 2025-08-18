import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { type Site, type AlertThreshold, type Metric } from '../backend/src/types';

export const AlertSetting: React.FC = () => {
  const { selectedSite, t } = useAppContext();
  const { authenticatedFetch } = useAuth();
  const [alertThresholds, setAlertThresholds] = useState<AlertThreshold[]>([]);
  const [editingThreshold, setEditingThreshold] = useState<Partial<AlertThreshold> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [metrics, setMetrics] = useState<Metric[]>([]);

  useEffect(() => {
    if (selectedSite) {
      fetchAlertThresholds(selectedSite);
    }
    const fetchMetrics = async () => {
      try {
        const response = await authenticatedFetch('/api/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        } else {
          console.error('Failed to fetch metrics', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    };
    fetchMetrics();
  }, [selectedSite, authenticatedFetch]);

  const fetchAlertThresholds = async (site: Site) => {
    try {
      const response = await authenticatedFetch(`/api/alert-thresholds/${site.id}`);
      if (response.ok) {
        const data = await response.json();
        setAlertThresholds(data);
      } else {
        console.error('Failed to fetch alert thresholds', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching alert thresholds:', error);
    }
  };

  const handleEdit = (threshold: AlertThreshold) => {
    setEditingThreshold({ ...threshold });
    setIsModalOpen(true);
  };

  const handleDelete = async (metric_id: number) => {
    const metricName = metrics.find(m => m.id === metric_id)?.display_name || 'this metric';
    if (!selectedSite || !confirm(t('confirm_delete_alert_threshold').replace('{{metricName}}', metricName))) return;

    try {
      const response = await authenticatedFetch(`/api/alert-thresholds/${selectedSite.id}/${metric_id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchAlertThresholds(selectedSite);
      } else {
        console.error('Failed to delete alert threshold', response.statusText);
      }
    } catch (error) {
      console.error('Error deleting alert threshold:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite || !editingThreshold) return;

    try {
      const { id, metric_id, min_warning, max_warning, min_alert, max_alert } = editingThreshold;
      const requestBody = { id, metric_id, min_warning, max_warning, min_alert, max_alert };

      const response = await authenticatedFetch(`/api/alert-thresholds/${selectedSite.id}/${editingThreshold.metric_id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        fetchAlertThresholds(selectedSite);
        setIsModalOpen(false);
        setEditingThreshold(null);
      } else {
        console.error('Failed to save alert threshold', response.statusText);
      }
    } catch (error) {
      console.error('Error saving alert threshold:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingThreshold(prev => ({
      ...prev!,
      [name]: value === '' ? null : Number(value),
    }));
  };

  const handleAdd = () => {
    setEditingThreshold({
      site_id: selectedSite?.id || '',
      metric_id: metrics[0]?.id || 0,
      min_warning: null,
      max_warning: null,
      min_alert: null,
      max_alert: null,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-brand-text mb-6">{t('alert_settings')}</h1>

      <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-lg p-4 sm:p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-brand-text">{t('current_alert_thresholds')}</h2>
          <button onClick={handleAdd} className="bg-brand-accent hover:bg-brand-accent-light text-white font-bold py-2 px-4 rounded-lg transition-colors">
            {t('add_new_threshold')}
          </button>
        </div>

        {alertThresholds.length === 0 ? (
          <p className="text-gray-600 dark:text-brand-text-dim">{t('no_alert_thresholds_defined')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-brand-dark">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-brand-text-dim uppercase tracking-wider">{t('metric')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-brand-text-dim uppercase tracking-wider">{t('min_warning')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-brand-text-dim uppercase tracking-wider">{t('max_warning')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-brand-text-dim uppercase tracking-wider">{t('min_alert')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-brand-text-dim uppercase tracking-wider">{t('max_alert')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-brand-text-dim uppercase tracking-wider">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-brand-dark-light divide-y divide-gray-200 dark:divide-gray-700">
                {alertThresholds.map((threshold) => (
                  <tr key={threshold.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-brand-text">{t(threshold.display_name || threshold.mqtt_param || 'N/A')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-brand-text-dim">{threshold.min_warning ?? 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-brand-text-dim">{threshold.max_warning ?? 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-brand-text-dim">{threshold.min_alert ?? 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-brand-text-dim">{threshold.max_alert ?? 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEdit(threshold)} className="text-brand-accent hover:text-brand-accent-light mr-3">{t('edit')}</button>
                      <button onClick={() => handleDelete(threshold.metric_id)} className="text-red-600 hover:text-red-900">{t('delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && editingThreshold && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-brand-text mb-4">
              {editingThreshold.id ? t('edit_alert_threshold') : t('add_alert_threshold')}
            </h2>
            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label htmlFor="metric_id" className="block text-sm font-medium text-gray-700 dark:text-brand-text-dim">{t('metric')}</label>
                  <select id="metric_id" name="metric_id" value={editingThreshold.metric_id || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent dark:bg-brand-dark dark:border-gray-600 dark:text-brand-text-dim" required>
                    <option value="">{t('select_metric')}</option>
                    {metrics.map(metric => (
                      <option key={metric.id} value={metric.id}>{t(metric.display_name)}</option>
                    ))}
                  </select>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="min_warning" className="block text-sm font-medium text-gray-700 dark:text-brand-text-dim">{t('min_warning')}</label>
                  <input type="number" id="min_warning" name="min_warning" value={editingThreshold.min_warning ?? ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent dark:bg-brand-dark dark:border-gray-600 dark:text-brand-text-dim" step="any" />
                </div>
                <div>
                  <label htmlFor="max_warning" className="block text-sm font-medium text-gray-700 dark:text-brand-text-dim">{t('max_warning')}</label>
                  <input type="number" id="max_warning" name="max_warning" value={editingThreshold.max_warning ?? ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent dark:bg-brand-dark dark:border-gray-600 dark:text-brand-text-dim" step="any" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="min_alert" className="block text-sm font-medium text-gray-700 dark:text-brand-text-dim">{t('min_alert')}</label>
                  <input type="number" id="min_alert" name="min_alert" value={editingThreshold.min_alert ?? ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent dark:bg-brand-dark dark:border-gray-600 dark:text-brand-text-dim" step="any" />
                </div>
                <div>
                  <label htmlFor="max_alert" className="block text-sm font-medium text-gray-700 dark:text-brand-text-dim">{t('max_alert')}</label>
                  <input type="number" id="max_alert" name="max_alert" value={editingThreshold.max_alert ?? ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent dark:bg-brand-dark dark:border-gray-600 dark:text-brand-text-dim" step="any" />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md text-gray-700 dark:text-brand-text-dim bg-gray-200 dark:bg-brand-dark hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 rounded-md bg-brand-accent text-white hover:bg-brand-accent-light transition-colors">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
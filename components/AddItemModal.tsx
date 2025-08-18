import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Metric, MetricGroup as MetricGroupType } from '../backend/src/types';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string | null;
  onAddItem: (sectionId: string, itemType: 'metric' | 'group', itemId: string) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, sectionId, onAddItem }) => {
  const { t } = useAppContext();
  const { authenticatedFetch } = useAuth();
  const [itemType, setItemType] = useState<'metric' | 'group'>('metric');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [availableMetrics, setAvailableMetrics] = useState<Metric[]>([]);
  const [availableMetricGroups, setAvailableMetricGroups] = useState<MetricGroupType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchAvailableItems = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const [metricsResponse, metricGroupsResponse] = await Promise.all([
            authenticatedFetch('/api/metrics', { cache: 'no-store' }),
            authenticatedFetch('/api/metric-groups', { cache: 'no-store' })
          ]);

          if (!metricsResponse.ok) throw new Error(`HTTP error! status: ${metricsResponse.status}`);
          if (!metricGroupsResponse.ok) throw new Error(`HTTP error! status: ${metricGroupsResponse.status}`);

          const metricsData: Metric[] = await metricsResponse.json();
          const metricGroupsData: MetricGroupType[] = await metricGroupsResponse.json();

          setAvailableMetrics(metricsData);
          setAvailableMetricGroups(metricGroupsData);
          
          if (itemType === 'metric' && metricsData.length > 0) {
            setSelectedItemId(metricsData[0].id!.toString());
          } else if (itemType === 'group' && metricGroupsData.length > 0) {
            setSelectedItemId(metricGroupsData[0].id!.toString());
          } else {
            setSelectedItemId('');
          }

        } catch (err) {
          console.error("Failed to fetch available items:", err);
          setError(t('failed_to_load_items'));
        } finally {
          setIsLoading(false);
        }
      };
      fetchAvailableItems();
    }
  }, [isOpen, authenticatedFetch, t, itemType]);

  const handleAddItem = () => {
    if (sectionId && selectedItemId) {
      onAddItem(sectionId, itemType, selectedItemId);
      onClose();
    }
  };

  if (!isOpen) return null;

  const itemsToDisplay = itemType === 'metric' ? availableMetrics : availableMetricGroups;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col">
        <h2 className="text-2xl font-bold text-brand-accent mb-4">{t('add_item_to_section')}</h2>
        {isLoading && <p>{t('loading_items')}</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!isLoading && !error && (
          <>
            <div className="mb-4">
              <label htmlFor="itemType" className="block text-gray-700 dark:text-brand-text-dim text-sm font-bold mb-2">
                {t('item_type')}
              </label>
              <select
                id="itemType"
                className="shadow border rounded w-full py-2 px-3 text-gray-700 dark:text-brand-text-dim leading-tight focus:outline-none focus:shadow-outline bg-white dark:bg-brand-dark"
                value={itemType}
                onChange={(e) => {
                  setItemType(e.target.value as 'metric' | 'group');
                  setSelectedItemId('');
                }}
              >
                <option value="metric">{t('metric')}</option>
                <option value="group">{t('metric_group')}</option>
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="itemSelection" className="block text-gray-700 dark:text-brand-text-dim text-sm font-bold mb-2">
                {t('select_item')}
              </label>
              <select
                id="itemSelection"
                className="shadow border rounded w-full py-2 px-3 text-gray-700 dark:text-brand-text-dim leading-tight focus:outline-none focus:shadow-outline bg-white dark:bg-brand-dark"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                disabled={itemsToDisplay.length === 0}
              >
                {itemsToDisplay.length === 0 ? (
                  <option value="">{t('no_items_available')}</option>
                ) : (
                  itemsToDisplay.map((item) => (
                    <option key={item.id} value={item.id!.toString()}>
                      {'name' in item ? item.name : item.display_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleAddItem}
                className="bg-brand-accent hover:bg-brand-accent-light text-white font-bold py-2 px-4 rounded-lg transition-colors"
                disabled={!selectedItemId}
              >
                {t('add')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
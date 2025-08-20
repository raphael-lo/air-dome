import React, { useState, useEffect } from 'react';
import type { Metric } from '../backend/src/types';
import { IconPicker } from './IconPicker';

export const MetricFormModal: React.FC<{ isOpen: boolean, onClose: () => void, onSave: (data: Partial<Metric>) => void, metric: Partial<Metric> | null }> = ({ isOpen, onClose, onSave, metric }) => {
    const [formData, setFormData] = useState<Partial<Metric>>({});

    useEffect(() => {
        setFormData(metric || {});
    }, [metric]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleIconSelect = (iconName: string) => {
        setFormData({ ...formData, icon: iconName });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-2xl p-6 w-full max-w-md overflow-y-auto max-h-screen">
                <h2 className="text-2xl font-bold text-brand-accent mb-4">{formData.id ? 'Edit Metric Rule' : 'Add Metric Rule'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    <div>
                        <label htmlFor="display_name" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Display Name</label>
                        <p className="text-xs text-gray-400 dark:text-brand-text-dim mb-1">The human-friendly name for this metric (e.g., 'Internal Temperature').</p>
                        <input id="display_name" name="display_name" type="text" value={formData.display_name || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" required />
                    </div>

                    <div>
                        <label htmlFor="display_name_tc" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Display Name (Traditional Chinese)</label>
                        <input id="display_name_tc" name="display_name_tc" type="text" value={formData.display_name_tc || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" />
                    </div>

                    <div>
                        <label htmlFor="topic" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Topic</label>
                        <p className="text-xs text-gray-400 dark:text-brand-text-dim mb-1">The MQTT topic that this rule applies to.</p>
                        <input id="topic" name="topic" type="text" placeholder="e.g., air-dome/data" value={formData.topic || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" />
                    </div>

                    <div>
                        <label htmlFor="device_param" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Device ID Key <span className="text-gray-400">(device_param)</span></label>
                        <p className="text-xs text-gray-400 dark:text-brand-text-dim mb-1">The key in the JSON payload that contains the unique device ID (e.g., 'deviceid' or 'sensor_id').</p>
                        <input id="device_param" name="device_param" type="text" placeholder="e.g., deviceid" value={formData.device_param || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" />
                    </div>

                    <div>
                        <label htmlFor="device_id" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Device ID Value <span className="text-gray-400">(device_id)</span></label>
                        <p className="text-xs text-gray-400 dark:text-brand-text-dim mb-1">The value of the device ID for this rule (e.g., 'sensor-1' or 'external-unit').</p>
                        <input id="device_id" name="device_id" type="text" placeholder="e.g., sensor-1" value={formData.device_id || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" />
                    </div>

                    <div>
                        <label htmlFor="mqtt_param" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Metric Key <span className="text-gray-400">(mqtt_param)</span></label>
                        <p className="text-xs text-gray-400 dark:text-brand-text-dim mb-1">The key in the JSON payload that contains the metric value (e.g., 'temperature').</p>
                        <input id="mqtt_param" name="mqtt_param" type="text" placeholder="e.g., temperature" value={formData.mqtt_param || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" required />
                    </div>

                    <div>
                        <label htmlFor="unit" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Unit</label>
                        <p className="text-xs text-gray-400 dark:text-brand-text-dim mb-1">The unit of measurement for this metric (e.g., '°C' or 'Pa').</p>
                        <input id="unit" name="unit" type="text" placeholder="e.g., °C" value={formData.unit || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Icon</label>
                        <IconPicker selectedIcon={formData.icon || ''} onSelectIcon={handleIconSelect} />
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-brand-dark-lightest text-gray-800 dark:text-brand-text font-semibold rounded-lg">Cancel</button>
                        <button type="submit" className="py-2 px-4 bg-brand-accent text-white font-semibold rounded-lg">{formData.id ? 'Update Rule' : 'Create Rule'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
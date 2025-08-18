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
                <h2 className="text-2xl font-bold text-brand-accent mb-4">{formData.id ? 'Edit Metric' : 'Add Metric'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="display_name" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Display Name (English)</label>
                        <input id="display_name" name="display_name" type="text" value={formData.display_name || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" required />
                    </div>
                    <div>
                        <label htmlFor="display_name_tc" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Display Name (Traditional Chinese)</label>
                        <input id="display_name_tc" name="display_name_tc" type="text" value={formData.display_name_tc || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Icon</label>
                        <IconPicker selectedIcon={formData.icon || ''} onSelectIcon={handleIconSelect} />
                    </div>
                    <div>
                        <label htmlFor="mqtt_param" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">MQTT Param</label>
                        <input id="mqtt_param" name="mqtt_param" type="text" value={formData.mqtt_param || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" required />
                    </div>
                    <div>
                        <label htmlFor="device_id" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Device ID</label>
                        <input id="device_id" name="device_id" type="text" value={formData.device_id || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" required />
                    </div>
                    <div>
                        <label htmlFor="device_param" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Device Param</label>
                        <input id="device_param" name="device_param" type="text" value={formData.device_param || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" required />
                    </div>
                    <div>
                        <label htmlFor="unit" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Unit</label>
                        <input id="unit" name="unit" type="text" value={formData.unit || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-brand-dark-lightest text-gray-800 dark:text-brand-text font-semibold rounded-lg">Cancel</button>
                        <button type="submit" className="py-2 px-4 bg-brand-accent text-white font-semibold rounded-lg">{formData.id ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
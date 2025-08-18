import React, { useState, useEffect } from 'react';
import type { Metric, MetricGroup } from '../backend/src/types';
import { IconPicker } from './IconPicker';

export const MetricGroupFormModal: React.FC<{ isOpen: boolean, onClose: () => void, onSave: (data: Partial<MetricGroup>) => void, group: Partial<MetricGroup> | null, metrics: Metric[] }> = ({ isOpen, onClose, onSave, group, metrics }) => {
    const [formData, setFormData] = useState<Partial<MetricGroup>>({});

    useEffect(() => {
        setFormData(group || {});
    }, [group]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.name.includes('_id') ? Number(e.target.value) : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
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
            <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-2xl p-6 w-full max-w-lg overflow-y-auto max-h-screen">
                <h2 className="text-2xl font-bold text-brand-accent mb-4">{formData.id ? 'Edit Group' : 'Add Group'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Name (English)</label>
                            <input id="name" name="name" type="text" value={formData.name || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" required />
                        </div>
                        <div>
                            <label htmlFor="name_tc" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Name (Traditional Chinese)</label>
                            <input id="name_tc" name="name_tc" type="text" value={formData.name_tc || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Icon</label>
                        <IconPicker selectedIcon={formData.icon || ''} onSelectIcon={handleIconSelect} />
                    </div>
                    <hr className="my-4"/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="metric1_id" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Metric 1</label>
                            <select id="metric1_id" name="metric1_id" value={formData.metric1_id || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md">
                                <option value="">None</option>
                                {metrics.map(m => <option key={m.id} value={m.id}>{m.display_name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="metric1_display_name" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Metric 1 Display Name</label>
                            <input id="metric1_display_name" name="metric1_display_name" type="text" value={formData.metric1_display_name || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="metric1_display_name_tc" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Metric 1 Display Name (TC)</label>
                            <input id="metric1_display_name_tc" name="metric1_display_name_tc" type="text" value={formData.metric1_display_name_tc || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="metric2_id" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Metric 2</label>
                            <select id="metric2_id" name="metric2_id" value={formData.metric2_id || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md">
                                <option value="">None</option>
                                {metrics.map(m => <option key={m.id} value={m.id}>{m.display_name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="metric2_display_name" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Metric 2 Display Name</label>
                            <input id="metric2_display_name" name="metric2_display_name" type="text" value={formData.metric2_display_name || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="metric2_display_name_tc" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Metric 2 Display Name (TC)</label>
                            <input id="metric2_display_name_tc" name="metric2_display_name_tc" type="text" value={formData.metric2_display_name_tc || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" />
                        </div>
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
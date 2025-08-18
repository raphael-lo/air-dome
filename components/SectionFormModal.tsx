import React, { useState, useEffect } from 'react';
import type { Section } from '../backend/src/types';

export const SectionFormModal: React.FC<{ isOpen: boolean, onClose: () => void, onSave: (data: Partial<Section>) => void, section: Partial<Section> | null }> = ({ isOpen, onClose, onSave, section }) => {
    const [formData, setFormData] = useState<Partial<Section>>({});

    useEffect(() => {
        setFormData(section || {});
    }, [section]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-2xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold text-brand-accent mb-4">{formData.id ? 'Edit Section' : 'Add Section'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Name (English)</label>
                        <input id="name" name="name" type="text" value={formData.name || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" required />
                    </div>
                    <div>
                        <label htmlFor="name_tc" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Name (Traditional Chinese)</label>
                        <input id="name_tc" name="name_tc" type="text" value={formData.name_tc || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" />
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
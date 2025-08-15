import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchMetrics, createMetric, updateMetric, deleteMetric, fetchMetricGroups, createMetricGroup, updateMetricGroup, deleteMetricGroup, fetchSections, createSection, updateSection, deleteSection, updateSectionItems } from '../services/geminiService';
import type { Metric, MetricGroup, Section } from '../types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragHandleIcon } from './icons/NavIcons';

const SortableItem: React.FC<{ id: any, children: React.ReactNode }> = ({ id, children }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}> 
            <div className="flex items-center">
                <div {...listeners} className="cursor-move p-2"> 
                    <DragHandleIcon className="h-6 w-6 text-gray-500" />
                </div>
                <div className="w-full">{children}</div> 
            </div> 
        </div>
    );
};

const MetricsView: React.FC = () => {
    const { authenticatedFetch } = useAuth();
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [metricGroups, setMetricGroups] = useState<MetricGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMetric, setEditingMetric] = useState<Metric | null>(null);

    const [mqttParam, setMqttParam] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [deviceId, setDeviceId] = useState('');
    const [groupId, setGroupId] = useState<number | undefined>(undefined);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [metricsData, metricGroupsData] = await Promise.all([
                fetchMetrics({ authenticatedFetch }),
                fetchMetricGroups({ authenticatedFetch }),
            ]);
            setMetrics(metricsData);
            setMetricGroups(metricGroupsData);
        } catch (error) {
            setError('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (metric: Metric | null) => {
        setEditingMetric(metric);
        if (metric) {
            setMqttParam(metric.mqtt_param);
            setDisplayName(metric.display_name);
            setDeviceId(metric.device_id);
            setGroupId(metric.group_id);
        } else {
            setMqttParam('');
            setDisplayName('');
            setDeviceId('');
            setGroupId(undefined);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMetric(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const metricData = { mqtt_param: mqttParam, display_name: displayName, device_id: deviceId, group_id: groupId! };
        try {
            if (editingMetric) {
                await updateMetric(editingMetric.id, metricData, { authenticatedFetch });
            } else {
                await createMetric(metricData, { authenticatedFetch });
            }
            loadData();
            handleCloseModal();
        } catch (error) {
            setError('Failed to save metric');
        }
    };

    const handleDelete = async (metricId: number) => {
        try {
            await deleteMetric(metricId, { authenticatedFetch });
            loadData();
        } catch (error) {
            setError('Failed to delete metric');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-brand-text">Metrics</h2>
                <button onClick={() => handleOpenModal(null)} className="bg-brand-accent hover:bg-brand-accent-light text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Add Metric
                </button>
            </div>

            {isLoading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}

            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-brand-dark-lightest">
                        <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">MQTT Param</th>
                        <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">Display Name</th>
                        <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">Device ID</th>
                        <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">Group</th>
                        <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {metrics.map(metric => (
                        <tr key={metric.id} className="border-b border-gray-200 dark:border-brand-dark-lightest hover:bg-gray-50 dark:hover:bg-brand-dark transition-colors">
                            <td className="p-3 font-medium text-gray-800 dark:text-brand-text">{metric.mqtt_param}</td>
                            <td className="p-3 text-gray-800 dark:text-brand-text">{metric.display_name}</td>
                            <td className="p-3 text-gray-800 dark:text-brand-text">{metric.device_id}</td>
                            <td className="p-3 text-gray-800 dark:text-brand-text">{metricGroups.find(g => g.id === metric.group_id)?.name}</td>
                            <td className="p-3 text-center">
                                <button onClick={() => handleOpenModal(metric)} className="text-blue-500 hover:underline">Edit</button>
                                <button onClick={() => handleDelete(metric.id)} className="text-red-500 hover:underline ml-4">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-2xl p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-brand-accent mb-4">{editingMetric ? 'Edit Metric' : 'Add Metric'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="mqtt_param" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">MQTT Param</label>
                                <input id="mqtt_param" type="text" value={mqttParam} onChange={e => setMqttParam(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" required />
                            </div>
                            <div>
                                <label htmlFor="display_name" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Display Name</label>
                                <input id="display_name" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" required />
                            </div>
                            <div>
                                <label htmlFor="device_id" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Device ID</label>
                                <input id="device_id" type="text" value={deviceId} onChange={e => setDeviceId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" required />
                            </div>
                            <div>
                                <label htmlFor="group_id" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Group</label>
                                <select id="group_id" value={groupId} onChange={e => setGroupId(Number(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-brand-dark border-gray-300 dark:border-brand-dark-lightest rounded-md" required>
                                    <option value="">Select a group</option>
                                    {metricGroups.map(group => (
                                        <option key={group.id} value={group.id}>{group.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={handleCloseModal} className="py-2 px-4 bg-gray-200 dark:bg-brand-dark-lightest text-gray-800 dark:text-brand-text font-semibold rounded-lg">Cancel</button>
                                <button type="submit" className="py-2 px-4 bg-brand-accent text-white font-semibold rounded-lg">{editingMetric ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const MetricGroupsView: React.FC = () => {
    const { authenticatedFetch } = useAuth();
    const [metricGroups, setMetricGroups] = useState<MetricGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<MetricGroup | null>(null);

    const [name, setName] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const metricGroupsData = await fetchMetricGroups({ authenticatedFetch });
            setMetricGroups(metricGroupsData);
        } catch (error) {
            setError('Failed to load metric groups');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (group: MetricGroup | null) => {
        setEditingGroup(group);
        if (group) {
            setName(group.name);
        } else {
            setName('');
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingGroup(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const groupData = { name };
        try {
            if (editingGroup) {
                await updateMetricGroup(editingGroup.id, groupData, { authenticatedFetch });
            } else {
                await createMetricGroup(groupData, { authenticatedFetch });
            }
            loadData();
            handleCloseModal();
        } catch (error) {
            setError('Failed to save metric group');
        }
    };

    const handleDelete = async (groupId: number) => {
        try {
            await deleteMetricGroup(groupId, { authenticatedFetch });
            loadData();
        } catch (error) {
            setError('Failed to delete metric group');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-brand-text">Metric Groups</h2>
                <button onClick={() => handleOpenModal(null)} className="bg-brand-accent hover:bg-brand-accent-light text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Add Group
                </button>
            </div>

            {isLoading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}

            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-brand-dark-lightest">
                        <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">Name</th>
                        <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {metricGroups.map(group => (
                        <tr key={group.id} className="border-b border-gray-200 dark:border-brand-dark-lightest hover:bg-gray-50 dark:hover:bg-brand-dark transition-colors">
                            <td className="p-3 font-medium text-gray-800 dark:text-brand-text">{group.name}</td>
                            <td className="p-3 text-center">
                                <button onClick={() => handleOpenModal(group)} className="text-blue-500 hover:underline">Edit</button>
                                <button onClick={() => handleDelete(group.id)} className="text-red-500 hover:underline ml-4">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-2xl p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-brand-accent mb-4">{editingGroup ? 'Edit Group' : 'Add Group'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Name</label>
                                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" required />
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={handleCloseModal} className="py-2 px-4 bg-gray-200 dark:bg-brand-dark-lightest text-gray-800 dark:text-brand-text font-semibold rounded-lg">Cancel</button>
                                <button type="submit" className="py-2 px-4 bg-brand-accent text-white font-semibold rounded-lg">{editingGroup ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const SectionsView: React.FC = () => {
    const { authenticatedFetch } = useAuth();
    const [sections, setSections] = useState<Section[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<Section | null>(null);

    const [name, setName] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const sectionsData = await fetchSections({ authenticatedFetch });
            setSections(sectionsData.map(section => ({ ...section, items: [] })));
        } catch (error) {
            setError('Failed to load sections');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (section: Section | null) => {
        setEditingSection(section);
        if (section) {
            setName(section.name);
        } else {
            setName('');
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSection(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const sectionData = { name };
        try {
            if (editingSection) {
                await updateSection(editingSection.id, sectionData, { authenticatedFetch });
            } else {
                await createSection(sectionData, { authenticatedFetch });
            }
            loadData();
            handleCloseModal();
        } catch (error) {
            setError('Failed to save section');
        }
    };

    const handleDelete = async (sectionId: number) => {
        try {
            await deleteSection(sectionId, { authenticatedFetch });
            loadData();
        } catch (error) {
            setError('Failed to delete section');
        }
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setSections((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);
                updateSectionItems(over.id, newItems.map((item, index) => ({ ...item, item_order: index })), { authenticatedFetch });
                return newItems;
            });
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-brand-text">Sections</h2>
                <button onClick={() => handleOpenModal(null)} className="bg-brand-accent hover:bg-brand-accent-light text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Add Section
                </button>
            </div>

            {isLoading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {sections.map(section => (
                        <SortableItem key={section.id} id={section.id}>
                            <div className="p-4 border border-gray-200 dark:border-brand-dark-lightest rounded-lg mb-4 w-full">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-brand-text">{section.name}</h3>
                                    </div>
                                    <div className="flex items-center">
                                        <button onClick={() => handleOpenModal(section)} className="text-blue-500 hover:underline">Edit</button>
                                        <button onClick={() => handleDelete(section.id)} className="text-red-500 hover:underline ml-4">Delete</button>
                                    </div>
                                </div>
                                <div className="p-4 mt-4 border-t border-gray-200 dark:border-brand-dark-lightest">
                                    {section.items.length > 0 ? (
                                        <p>Items here</p>
                                    ) : (
                                        <p className="text-gray-500 dark:text-brand-text-dim">This section is empty.</p>
                                    )}
                                </div>
                            </div>
                        </SortableItem>
                    ))}
                </SortableContext>
            </DndContext>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-brand-dark-light rounded-lg shadow-2xl p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-brand-accent mb-4">{editingSection ? 'Edit Section' : 'Add Section'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-600 dark:text-brand-text-dim">Name</label>
                                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-brand-dark border border-gray-300 dark:border-brand-dark-lightest rounded-md" required />
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={handleCloseModal} className="py-2 px-4 bg-gray-200 dark:bg-brand-dark-lightest text-gray-800 dark:text-brand-text font-semibold rounded-lg">Cancel</button>
                                <button type="submit" className="py-2 px-4 bg-brand-accent text-white font-semibold rounded-lg">{editingSection ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export const Metrics: React.FC = () => {
    const [activeTab, setActiveTab] = useState('metrics');

    return (
        <div>
            <div className="flex border-b border-gray-200 dark:border-brand-dark-lightest">
                <button onClick={() => setActiveTab('metrics')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'metrics' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-gray-500 hover:text-gray-700'}`}>
                    Metrics
                </button>
                <button onClick={() => setActiveTab('groups')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'groups' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-gray-500 hover:text-gray-700'}`}>
                    Metric Groups
                </button>
                <button onClick={() => setActiveTab('sections')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'sections' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-gray-500 hover:text-gray-700'}`}>
                    Sections
                </button>
            </div>
            <div className="pt-4">
                {activeTab === 'metrics' && <MetricsView />}
                {activeTab === 'groups' && <MetricGroupsView />}
                {activeTab === 'sections' && <SectionsView />}
            </div>
        </div>
    );
};
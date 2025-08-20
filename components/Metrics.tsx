import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    fetchMetrics, createMetric, updateMetric, deleteMetric, 
    fetchMetricGroups, createMetricGroup, updateMetricGroup, deleteMetricGroup, 
    fetchSections, createSection, updateSection, deleteSection, 
    updateSectionItems, fetchSectionItems, addSectionItem, removeSectionItem,
    updateSectionOrder
} from '../services/geminiService';
import type { Metric, MetricGroup, Section, SectionItem } from '../backend/src/types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragHandleIcon } from './icons/NavIcons';
import * as MetricIcons from './icons/MetricIcons';
import { IconPicker } from './IconPicker';
import { useAppContext } from '../context/AppContext';
import { SpinnerIcon } from './icons/MetricIcons';
import { SectionFormModal } from './SectionFormModal';
import { MetricFormModal } from './MetricFormModal';
import { MetricGroupFormModal } from './MetricGroupFormModal';
import { SectionItemsModal } from './SectionItemsModal'; // Import the new modal

// --- Types ---
interface SectionWithItems extends Section {
  items: SectionItem[];
}

// --- Reusable Components ---
const SortableItem: React.FC<{ id: any, children: React.ReactNode, handle?: boolean, data?: object }> = ({ id, children, handle = true, data }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, data });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} {...attributes} className="flex items-center bg-white dark:bg-brand-dark-light rounded-lg shadow mb-2">
            {handle && <div {...listeners} className="cursor-grab p-3 text-gray-400"><DragHandleIcon className="h-5 w-5" /></div>}
            <div className="w-full p-3">{children}</div>
        </div>
    );
};

// --- Main Views ---

const MetricsView: React.FC = () => {
    const { authenticatedFetch } = useAuth();
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMetric, setEditingMetric] = useState<Partial<Metric> | null>(null);

    const loadMetrics = async () => {
        setIsLoading(true);
        const data = await fetchMetrics({ authenticatedFetch });
        setMetrics(data);
        setIsLoading(false);
    };

    useEffect(() => { loadMetrics(); }, []);

    const handleOpenModal = (metric: Partial<Metric> | null) => {
        setEditingMetric(metric || {});
        setIsModalOpen(true);
    };

    const handleSave = async (metricData: Partial<Metric>) => {
        if (metricData.id) {
            await updateMetric(metricData.id, metricData, { authenticatedFetch });
        } else {
            await createMetric(metricData as Omit<Metric, 'id'>, { authenticatedFetch });
        }
        loadMetrics();
        setIsModalOpen(false);
    };

    const handleDelete = async (metricId: number) => {
        if (window.confirm('Are you sure you want to delete this metric?')) {
            await deleteMetric(metricId, { authenticatedFetch });
            loadMetrics();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Metrics</h2>
                <button onClick={() => handleOpenModal(null)} className="bg-brand-accent text-white py-2 px-4 rounded-lg">Add Metric</button>
            </div>
            {isLoading ? <div className="flex justify-center items-center"><SpinnerIcon className="h-8 w-8 animate-spin" /></div> : 
            <div className="overflow-x-auto bg-white dark:bg-brand-dark-light rounded-lg shadow">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-brand-dark-lightest">
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">Display Name</th>
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">Display Name (TC)</th>
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">Topic</th>
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">Device ID Key (device_param)</th>
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">Device ID Value (device_id)</th>
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">Metric Key (mqtt_param)</th>
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim">Unit</th>
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-brand-text-dim text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {metrics.map(metric => (
                            <tr key={metric.id} className="border-b border-gray-200 dark:border-brand-dark-lightest hover:bg-gray-50 dark:hover:bg-brand-dark transition-colors">
                                <td className="p-3 font-medium text-gray-800 dark:text-brand-text">{metric.display_name}</td>
                                <td className="p-3 text-gray-800 dark:text-brand-text">{metric.display_name_tc}</td>
                                <td className="p-3 text-gray-800 dark:text-brand-text">{metric.topic}</td>
                                <td className="p-3 text-gray-800 dark:text-brand-text">{metric.device_param}</td>
                                <td className="p-3 text-gray-800 dark:text-brand-text">{metric.device_id}</td>
                                <td className="p-3 text-gray-800 dark:text-brand-text">{metric.mqtt_param}</td>
                                <td className="p-3 text-gray-800 dark:text-brand-text">{metric.unit}</td>
                                <td className="p-3 text-center">
                                    <button onClick={() => handleOpenModal(metric)} className="text-blue-500 hover:underline">Edit</button>
                                    <button onClick={() => handleDelete(metric.id!)} className="text-red-500 hover:underline ml-4">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            }
            {isModalOpen && (
                <MetricFormModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    metric={editingMetric}
                />
            )}
        </div>
    );
};

const MetricGroupsView: React.FC = () => {
    const { authenticatedFetch } = useAuth();
    const [metricGroups, setMetricGroups] = useState<MetricGroup[]>([]);
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Partial<MetricGroup> | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        const [groups, metricsData] = await Promise.all([
            fetchMetricGroups({ authenticatedFetch }),
            fetchMetrics({ authenticatedFetch })
        ]);
        setMetricGroups(groups);
        setMetrics(metricsData);
        setIsLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleOpenModal = (group: Partial<MetricGroup> | null) => {
        setEditingGroup(group || {});
        setIsModalOpen(true);
    };

    const handleSave = async (groupData: Partial<MetricGroup>) => {
        if (groupData.id) {
            await updateMetricGroup(groupData.id, groupData, { authenticatedFetch });
        } else {
            await createMetricGroup(groupData as Omit<MetricGroup, 'id'>, { authenticatedFetch });
        }
        loadData();
        setIsModalOpen(false);
    };

    const handleDelete = async (groupId: number) => {
        if (window.confirm('Are you sure you want to delete this group?')) {
            await deleteMetricGroup(groupId, { authenticatedFetch });
            loadData();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Metric Groups</h2>
                <button onClick={() => handleOpenModal(null)} className="bg-brand-accent text-white py-2 px-4 rounded-lg">Add Group</button>
            </div>
            {isLoading ? <div className="flex justify-center items-center"><SpinnerIcon className="h-8 w-8 animate-spin" /></div> : 
            <div className="overflow-x-auto bg-white dark:bg-brand-dark-light rounded-lg shadow">
                <table className="w-full text-left">
                    {/* Table Head */}
                    <tbody>
                        {metricGroups.map(group => {
                            const IconComponent = group.icon ? MetricIcons[group.icon as keyof typeof MetricIcons] : null;
                            const metric1 = metrics.find(m => m.id === group.metric1_id);
                            const metric2 = metrics.find(m => m.id === group.metric2_id);
                            return (
                                <tr key={group.id} className="border-b border-gray-200 dark:border-brand-dark-lightest hover:bg-gray-50 dark:hover:bg-brand-dark transition-colors">
                                    <td className="p-3">{IconComponent && <IconComponent className="h-6 w-6" />}</td>
                                    <td className="p-3 font-medium text-gray-800 dark:text-brand-text">{group.name}</td>
                                    <td className="p-3 text-gray-800 dark:text-brand-text">{group.name_tc}</td>
                                    <td className="p-3 text-gray-800 dark:text-brand-text">{metric1?.display_name}</td>
                                    <td className="p-3 text-gray-800 dark:text-brand-text">{metric2?.display_name}</td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => handleOpenModal(group)} className="text-blue-500 hover:underline">Edit</button>
                                        <button onClick={() => handleDelete(group.id!)} className="text-red-500 hover:underline ml-4">Delete</button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            }
            {isModalOpen && (
                <MetricGroupFormModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    group={editingGroup}
                    metrics={metrics}
                />
            )}
        </div>
    );
};

const SectionsView: React.FC = () => {
    const { authenticatedFetch } = useAuth();
    const { t } = useAppContext();
    const [sections, setSections] = useState<SectionWithItems[]>([]);
    const [allMetrics, setAllMetrics] = useState<Metric[]>([]);
    const [allMetricGroups, setAllMetricGroups] = useState<MetricGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<Partial<Section> | null>(null);
    const [isSectionItemsModalOpen, setIsSectionItemsModalOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState<SectionWithItems | null>(null);

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const loadData = async () => {
        setIsLoading(true);
        const [sectionsData, metricsData, groupsData] = await Promise.all([
            fetchSections({ authenticatedFetch }),
            fetchMetrics({ authenticatedFetch }),
            fetchMetricGroups({ authenticatedFetch })
        ]);
        setAllMetrics(metricsData);
        setAllMetricGroups(groupsData);
        const sectionsWithItems = await Promise.all(
            sectionsData.map(async (section) => {
                const items = await fetchSectionItems(section.id!, { authenticatedFetch });
                return { ...section, items: items || [] };
            })
        );
        setSections(sectionsWithItems);
        setIsLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleOpenModal = (section: Partial<Section> | null) => {
        setEditingSection(section || {});
        setIsModalOpen(true);
    };

    const handleSaveSection = async (sectionData: Partial<Section>) => {
        if (sectionData.id) {
            await updateSection(sectionData.id, sectionData, { authenticatedFetch });
        } else {
            await createSection(sectionData as Omit<Section, 'id'>, { authenticatedFetch });
        }
        loadData();
        setIsModalOpen(false);
    };

    const handleDeleteSection = async (sectionId: number) => {
        if (window.confirm('Are you sure you want to delete this section?')) {
            await deleteSection(sectionId, { authenticatedFetch });
            loadData();
        }
    };

    

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;

        if (activeType === 'Section' && overType === 'Section') {
            setSections(prev => {
                const oldIndex = prev.findIndex(s => s.id === active.id);
                const newIndex = prev.findIndex(s => s.id === over.id);
                const reordered = arrayMove(prev, oldIndex, newIndex);
                updateSectionOrder(reordered.map((s: Section, i) => ({ id: s.id!, item_order: i })), { authenticatedFetch });
                return reordered;
            });
        }
    };

    const getItemName = (item: SectionItem) => {
        const collection = item.item_type === 'metric' ? allMetrics : allMetricGroups;
        const found = collection.find(m => m.id === item.item_id);
        return found ? (found.name || (found as Metric).display_name) : 'Unknown';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Sections</h2>
                <button onClick={() => handleOpenModal(null)} className="bg-brand-accent text-white py-2 px-4 rounded-lg">Add Section</button>
            </div>
            {isLoading ? <div className="flex justify-center items-center"><SpinnerIcon className="h-8 w-8 animate-spin" /></div> : 
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sections.map(s => s.id!)} strategy={verticalListSortingStrategy}>
                    {sections.map(section => (
                        <SortableItem key={section.id} id={section.id!} handle={true} data={{ type: 'Section', id: section.id }}>
                            <div className="w-full">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold">{section.name}</h3>
                                    <div>
                                        <button onClick={() => {setSelectedSection(section); setIsSectionItemsModalOpen(true);}} className="text-sm bg-blue-500 text-white py-1 px-2 rounded-md mr-2">Manage Items</button>
                                        <button onClick={() => handleOpenModal(section)} className="text-sm text-blue-500">Edit</button>
                                        <button onClick={() => handleDeleteSection(section.id!)} className="text-sm text-red-500 ml-2">Delete</button>
                                    </div>
                                </div>
                                <div className="mt-2 pl-4 border-l-2 border-gray-200">
                                    {section.items.length === 0 ? (
                                        <p className="text-gray-500 dark:text-brand-text-dim">No items in this section yet.</p>
                                    ) : (
                                        <ul className="list-disc list-inside">
                                            {section.items.map(item => (
                                                <li key={item.id} className="text-gray-700 dark:text-brand-text-dim">{item.item_type === 'metric' ? allMetrics.find(m => m.id === item.item_id)?.display_name : allMetricGroups.find(g => g.id === item.item_id)?.name}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </SortableItem>
                    ))}
                </SortableContext>
            </DndContext>
            }
            {isModalOpen && (
                <SectionFormModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveSection}
                    section={editingSection}
                />
            )}

            {isSectionItemsModalOpen && selectedSection && (
                <SectionItemsModal
                    isOpen={isSectionItemsModalOpen}
                    onClose={() => setIsSectionItemsModalOpen(false)}
                    section={selectedSection}
                    onSave={loadData} // Callback to refresh sections after item changes
                />
            )}
        </div>
    );
};

// --- Main Component ---
export const Metrics: React.FC = () => {
    const [activeTab, setActiveTab] = useState('metrics');

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex border-b border-gray-200 dark:border-brand-dark-lightest mb-4">
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
            <div>
                {activeTab === 'metrics' && <MetricsView />}
                {activeTab === 'groups' && <MetricGroupsView />}
                {activeTab === 'sections' && <SectionsView />}
            </div>
        </div>
    );
};

export default Metrics;
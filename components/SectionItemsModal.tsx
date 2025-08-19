import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    fetchMetrics, fetchMetricGroups, fetchSectionItems,
    updateSectionItems, addSectionItem, removeSectionItem
} from '../services/geminiService';
import type { Metric, MetricGroup, Section, SectionItem } from '../backend/src/types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragHandleIcon } from './icons/NavIcons';
import { AddItemModal } from './AddItemModal';
import { SpinnerIcon } from './icons/MetricIcons';

interface SectionItemsModalProps {
    isOpen: boolean;
    onClose: () => void;
    section: Section & { items: SectionItem[] };
    onSave: () => void; // Callback to refresh sections in parent
}

// --- Reusable Components ---
const SortableItem: React.FC<{ id: any, children: React.ReactNode, handle?: boolean, data?: object }> = ({ id, children, handle = true, data }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, data });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} {...attributes} className="flex items-center bg-white dark:bg-brand-dark-light rounded-lg shadow mb-2">
            {handle && <div {...listeners} className="cursor-grab p-3 text-gray-400"><DragHandleIcon className="h-5 w-5" /></div>}
            <div className="w-full p-3">
                {children}
            </div>
        </div>
    );
};

export const SectionItemsModal: React.FC<SectionItemsModalProps> = ({ isOpen, onClose, section, onSave }) => {
    const { authenticatedFetch } = useAuth();
    const [sectionItems, setSectionItems] = useState<SectionItem[]>(section.items);
    const [allMetrics, setAllMetrics] = useState<Metric[]>([]);
    const [allMetricGroups, setAllMetricGroups] = useState<MetricGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    useEffect(() => {
        const loadModalData = async () => {
            setIsLoading(true);
            const [metricsData, groupsData, itemsData] = await Promise.all([
                fetchMetrics({ authenticatedFetch }),
                fetchMetricGroups({ authenticatedFetch }),
                fetchSectionItems(section.id!, { authenticatedFetch })
            ]);
            setAllMetrics(metricsData);
            setAllMetricGroups(groupsData);
            setSectionItems(itemsData || []);
            setIsLoading(false);
        };
        if (isOpen) {
            loadModalData();
        }
    }, [isOpen, section.id, authenticatedFetch]);

    const handleAddItem = async (sectionId: number, itemType: 'metric' | 'group', itemId: number) => {
        const newOrder = sectionItems.length;
        await addSectionItem(sectionId, { item_id: itemId, item_type: itemType, item_order: newOrder }, { authenticatedFetch });
        // Refresh items after adding
        const updatedSection = await fetchSectionItems(sectionId, { authenticatedFetch });
        setSectionItems(updatedSection || []);
        onSave(); // Notify parent to refresh its sections
        setIsAddItemModalOpen(false);
    };

    const handleRemoveItem = async (sectionId: number, itemId: number) => {
        await removeSectionItem(sectionId, itemId, { authenticatedFetch });
        // Refresh items after removing
        const updatedSection = await fetchSectionItems(sectionId, { authenticatedFetch });
        setSectionItems(updatedSection || []);
        onSave(); // Notify parent to refresh its sections
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldItemIndex = sectionItems.findIndex(i => i.id === active.id);
        const newItemIndex = sectionItems.findIndex(i => i.id === over.id);

        if (oldItemIndex === -1 || newItemIndex === -1) return;

        const reorderedItems = arrayMove(sectionItems, oldItemIndex, newItemIndex);
        setSectionItems(reorderedItems);

        const updatedItems = reorderedItems.map((item: SectionItem, index) => ({ ...item, item_order: index }));
        updateSectionItems(section.id!, updatedItems, { authenticatedFetch });
        onSave(); // Notify parent to refresh its sections
    };

    const getItemName = (item: SectionItem) => {
        const collection = item.item_type === 'metric' ? allMetrics : allMetricGroups;
        const found = collection.find(m => m.id === item.item_id);
        return found ? (found.name || (found as Metric).display_name) : 'Unknown';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-brand-dark-light p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-brand-text">Manage Items for "{section.name}"</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-brand-text-dim dark:hover:text-brand-text">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-4">
                    <button onClick={() => setIsAddItemModalOpen(true)} className="bg-brand-accent text-white py-2 px-4 rounded-lg">Add Item</button>
                </div>

                {isLoading ? <div className="flex justify-center items-center"><SpinnerIcon className="h-8 w-8 animate-spin" /></div> :
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={sectionItems.map(i => i.id!)} strategy={verticalListSortingStrategy}>
                        {sectionItems.length === 0 ? (
                            <p className="text-gray-500 dark:text-brand-text-dim">No items in this section yet.</p>
                        ) : (
                            sectionItems.map(item => (
                                <SortableItem key={item.id} id={item.id!} handle={true}>
                                    <div className="flex justify-between items-center w-full">
                                        <span>{getItemName(item)}</span>
                                        <button onClick={() => handleRemoveItem(section.id!, item.id!)} className="text-xs text-red-500">Remove</button>
                                    </div>
                                </SortableItem>
                            ))
                        )}
                    </SortableContext>
                </DndContext>
                }

                {isAddItemModalOpen && (
                    <AddItemModal
                        isOpen={isAddItemModalOpen}
                        onClose={() => setIsAddItemModalOpen(false)}
                        onAddItem={handleAddItem}
                        sectionId={section.id!}
                        metrics={allMetrics}
                        metricGroups={allMetricGroups}
                    />
                )}
            </div>
        </div>
    );
};

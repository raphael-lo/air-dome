export interface Section {
  id?: number;
  name: string;
}

export interface SectionItem {
  id?: number;
  section_id: number;
  item_id: number;
  item_type: 'metric' | 'group';
  item_order: number;
}

import { Request, Response } from 'express';
import db from '../services/databaseService';
import { Metric } from '../models/metric'; // Added this line

interface SectionItem {
  item_id: number;
  item_type: 'metric' | 'group';
  item_order: number; // Changed from section_item_order
}

// interface Metric {
//   metric_id: number;
//   mqtt_param: string;
//   display_name: string;
//   device_id: string;
//   icon: string;
//   unit?: string; // Added
//   itemId?: number; // Add itemId
//   section_item_id?: number; // Added this line
// }

interface MetricGroup {
  metric_group_id: number;
  metric_group_name: string;
  metric_group_name_tc?: string; // Added
  metric_group_icon?: string; // This was already there, but now it's explicitly from DB
  metric1_id?: number;
  metric2_id?: number;
  metric1_display_name?: string; // Added
  metric1_display_name_tc?: string; // Added
  metric2_display_name?: string; // Added
  metric2_display_name_tc?: string; // Added
  metric1_group_display_name?: string; // Changed
  metric2_group_display_name?: string; // Changed
  metric1Data?: Metric;
  metric2Data?: Metric;
  metrics: Metric[];
  itemId?: number; // Add itemId
  section_item_id?: number; // Added this line
}

interface Section {
  section_id: number;
  section_name: string;
  section_name_tc?: string; // Added
  item_order: number; // Changed from section_order
  items: (Metric | MetricGroup)[];
}

export const getDomeMetricsStructure = (req: Request, res: Response) => {
  const query = `
    SELECT
        s.id AS section_id,
        s.name AS section_name,
        s.name_tc AS section_name_tc, -- Added
        s.item_order,
        si.id AS section_item_id,
        si.item_id,
        si.item_type,
        si.item_order AS section_item_order,
        mg.id AS metric_group_id,
        mg.name AS metric_group_name,
        mg.name_tc AS metric_group_name_tc, -- Added
        mg.icon AS metric_group_icon,
        mg.metric1_id,
        mg.metric1_display_name AS metric1_group_display_name, -- Changed alias
        mg.metric1_display_name_tc AS metric1_group_display_name_tc, -- Added
        mg.metric2_id,
        mg.metric2_display_name AS metric2_group_display_name, -- Changed alias
        mg.metric2_display_name_tc AS metric2_group_display_name_tc, -- Added
        m.id AS metric_id,
        m.mqtt_param,
        m.display_name,
        m.display_name_tc AS metric_display_name_tc, -- Added
        m.device_id,
        m.icon AS metric_icon,
        m.unit AS metric_unit, -- Added
        m1.display_name AS metric1_display_name,
        m1.mqtt_param AS metric1_mqtt_param,
        m1.device_id AS metric1_device_id,
        m1.icon AS metric1_icon,
        m1.unit AS metric1_unit, -- Added
        m2.display_name AS metric2_display_name,
        m2.mqtt_param AS metric2_mqtt_param,
        m2.device_id AS metric2_device_id,
        m2.icon AS metric2_icon,
        m2.unit AS metric2_unit -- Added
    FROM
        sections s
    LEFT JOIN
        section_items si ON s.id = si.section_id
    LEFT JOIN
        metric_groups mg ON si.item_id = mg.id AND si.item_type = 'group'
    LEFT JOIN
        metrics m ON si.item_id = m.id AND si.item_type = 'metric'
    LEFT JOIN
        metrics m1 ON mg.metric1_id = m1.id
    LEFT JOIN
        metrics m2 ON mg.metric2_id = m2.id
    ORDER BY
        s.item_order, si.item_order;
  `;

  db.all(query, [], (err, rows: any[]) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching dome metrics structure', error: err.message });
    }

    const sectionsMap = new Map<number, Section>();
    const metricGroupsMap = new Map<number, MetricGroup>();

    rows.forEach(row => {
      // Process Sections
      if (!sectionsMap.has(row.section_id)) {
        sectionsMap.set(row.section_id, {
          section_id: row.section_id,
          section_name: row.section_name,
          section_name_tc: row.section_name_tc, // Added
          item_order: row.item_order, // Changed from section_order
          items: [],
        });
      }
      const currentSection = sectionsMap.get(row.section_id)!;

      // Process Section Items (Metrics or Metric Groups)
      if (row.item_id) { // Only if there's an item associated with the section
        if (row.item_type === 'metric') {
          // Direct Metric
          currentSection.items.push({
            id: row.metric_id,
            mqtt_param: row.mqtt_param,
            display_name: row.display_name,
            display_name_tc: row.metric_display_name_tc, // Added
            device_id: row.device_id,
            icon: row.metric_icon, // Use metric_icon
            unit: row.metric_unit, // Added
            itemId: row.item_id, // Add itemId here
            section_item_id: row.section_item_id, // Add section_item_id here
          } as Metric); // Explicitly cast to Metric
        } else if (row.item_type === 'group') {
          // Metric Group
          if (!metricGroupsMap.has(row.metric_group_id)) {
            const newMetricGroup: MetricGroup = {
              metric_group_id: row.metric_group_id,
              metric_group_name: row.metric_group_name,
              metric_group_name_tc: row.metric_group_name_tc, // Added
              metric_group_icon: row.metric_group_icon,
              metric1_id: row.metric1_id,
              metric1_display_name: row.metric1_group_display_name, // Use group display name
              metric1_display_name_tc: row.metric1_group_display_name_tc, // Added
              metric2_id: row.metric2_id,
              metric2_display_name: row.metric2_group_display_name, // Use group display name
              metric2_display_name_tc: row.metric2_group_display_name_tc, // Added
              metric1_group_display_name: row.metric1_group_display_name, // Changed
              metric2_group_display_name: row.metric2_group_display_name, // Changed
              metrics: [],
              itemId: row.item_id,
              section_item_id: row.section_item_id,
            };

            if (row.metric1_id && row.metric1_display_name) {
              newMetricGroup.metric1Data = {
                id: row.metric1_id,
                mqtt_param: row.metric1_mqtt_param,
                device_param: row.metric1_device_id, // Added
                display_name: row.metric1_display_name,
                device_id: row.metric1_device_id,
                icon: row.metric1_icon,
                unit: row.metric1_unit, // Added
              };
            }
            if (row.metric2_id && row.metric2_display_name) {
              newMetricGroup.metric2Data = {
                id: row.metric2_id,
                mqtt_param: row.metric2_mqtt_param,
                device_param: row.metric2_device_id, // Added
                display_name: row.metric2_display_name,
                device_id: row.metric2_device_id,
                icon: row.metric2_icon,
                unit: row.metric2_unit, // Added
              };
            }
            metricGroupsMap.set(row.metric_group_id, newMetricGroup);
          }
          const currentMetricGroup = metricGroupsMap.get(row.metric_group_id)!;

          // Add metric to group if it exists
          if (row.metric_id) {
            currentMetricGroup.metrics.push({
              id: row.metric_id,
              mqtt_param: row.mqtt_param,
              device_param: row.device_id, // Added
              display_name: row.display_name,
              display_name_tc: row.metric_display_name_tc, // Add this
              device_id: row.device_id,
              icon: row.metric_icon, // Use metric_icon
              unit: row.metric_unit, // Use metric_unit
            });
          }

          // Add metric group to section if not already added
          const groupAlreadyAdded = currentSection.items.some(item =>
            (item as MetricGroup).metric_group_id === row.metric_group_id
          );
          if (!groupAlreadyAdded) {
            currentSection.items.push(currentMetricGroup);
          }
        }
      }
    });

    // Convert maps to arrays and sort
    const result = Array.from(sectionsMap.values()).sort((a, b) => a.item_order - b.item_order); // Changed from section_order

    // Sort items within sections and metrics within groups
    result.forEach(section => {
      section.items.sort((a, b) => {
        // Assuming section_item_order is available for sorting items within a section
        // This requires passing section_item_order through the processing
        // For now, a simple sort by type or ID might be needed if order is not in the row
        // Re-evaluate the parsing logic if section_item_order is critical for nested sorting
        const aOrder = (a as any).section_item_order !== undefined ? (a as any).section_item_order : (a as any).item_order; // Fallback
        const bOrder = (b as any).section_item_order !== undefined ? (b as any).section_item_order : (b as any).item_order; // Fallback
        return aOrder - bOrder;
      });
      section.items.forEach(item => {
        if ('metrics' in item) { // If it's a MetricGroup
          item.metrics.sort((a, b) => a.id - b.id); // Sort metrics within group
        }
      });
    });

    res.json(result);
  });
};

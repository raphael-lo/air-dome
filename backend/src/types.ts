export type View = 'alert_settings' | 'dashboard' | 'alerts' | 'ventilation' | 'lighting' | 'emergency' | 'reports' | 'settings' | 'users' | 'register' | 'metrics';

export type Language = 'en' | 'zh';

export type Theme = 'light' | 'dark';

export interface Site {
  id: string;
  nameKey: string;
}

export enum StatusLevel {
  Ok = 'ok',
  Warn = 'warn',
  Danger = 'danger',
}

export interface SensorData {
  id: number;
  pressure: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  timestamp: string;
}

export interface AirDomeData {
  internalPressure: { value: number; status: StatusLevel; history: number[] };
  externalPressure: { value: number; status: StatusLevel; history: number[] };
  fanSpeed: { value: number; status: StatusLevel; history: number[] };
  airExchangeRate: { value: number; status: StatusLevel; history: number[] };
  powerConsumption: { value: number; status: StatusLevel; history: number[] };
  voltage: { value: number; status: StatusLevel; history: number[] };
  current: { value: number; status: StatusLevel; history: number[] };
  externalWindSpeed: { value: number; status: StatusLevel; history: number[] };
  internalPM25: { value: number; status: StatusLevel; history: number[] };
  externalPM25: { value: number; status: StatusLevel; history: number[] };
  internalCO2: { value: number; status: StatusLevel; history: number[] };
  externalCO2: { value: number; status: StatusLevel; history: number[] };
  internalO2: { value: number; status: StatusLevel; history: number[] };
  externalO2: { value: number; status: StatusLevel; history: number[] };
  internalCO: { value: number; status: StatusLevel; history: number[] };
  externalCO: { value: number; status: StatusLevel; history: number[] };
  internalTemperature: { value: number; status: StatusLevel; history: number[] };
  externalTemperature: { value: number; status: StatusLevel; history: number[] };
  internalHumidity: { value: number; status: StatusLevel; history: number[] };
  externalHumidity: { value: number; status: StatusLevel; history: number[] };
  membraneHealth: { value: string; status: StatusLevel };
  internalNoise: { value: number; status: StatusLevel; history: number[] };
  externalNoise: { value: number; status: StatusLevel; history: number[] };
  basePressure: { value: number; status: StatusLevel; history: number[] };
  internalLux: { value: number; status: StatusLevel; history: number[] };
  lightingStatus: { value: string; status: StatusLevel };
  airShutterStatus: { value: string; status: StatusLevel };
  timestamp: string; // Add this line
}

export interface Alert {
  id: string;
  site_id: string;
  parameter: string;
  message: string;
  severity: StatusLevel;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

export interface FanSet {
  id: string;
  name: string;
  status: 'on' | 'off';
  mode: 'auto' | 'manual';
  inflow: number;
  outflow: number;
}

export interface LightingState {
    lights_on: boolean;
    brightness: number;
}

export interface User {
  id: string;
  username: string;
  role: 'Admin' | 'Operator' | 'Viewer';
  status: 'active' | 'disabled';
  created_at: string;
}

export interface Metric {
  id?: number;
  mqtt_param: string;
  device_param: string;
  display_name: string;
  display_name_tc?: string;
  device_id: string;
  icon: string;
  unit?: string;
  itemId?: number;
  section_item_id?: number;
}

export interface MetricGroup {
  id?: number;
  name: string;
  name_tc?: string; // Added
  icon: string;
  metric1_id?: number;
  metric1_display_name?: string;
  metric1_display_name_tc?: string; // Added
  metric2_id?: number;
  metric2_display_name?: string;
  metric2_display_name_tc?: string; // Added
}

export interface Section {
  id?: number;
  name: string;
  name_tc?: string;
  item_order: number;
}

export interface SectionItem {
  id?: number;
  section_id: number;
  item_id: number;
  item_type: 'metric' | 'group';
  item_order: number;
}

export interface DomeMetric {
  metric_id: number;
  mqtt_param: string;
  display_name: string;
  device_id: string;
  icon: string;
}

export interface DomeMetricGroup {
  metric_group_id: number;
  metric_group_name: string;
  metrics: DomeMetric[];
}

export interface DomeSectionItem {
  item_id: number;
  item_type: 'metric' | 'group';
  section_item_order: number;
}

export interface DomeSection {
  section_id: number;
  section_name: string;
  section_order: number;
  items: (DomeMetric | DomeMetricGroup)[];
}

export interface AlertThreshold {
  id: string;
  site_id: string;
  metric_id: number;
  min_warning: number | null;
  max_warning: number | null;
  min_alert: number | null;
  max_alert: number | null;
  // These are for display and are joined from the metrics table
  mqtt_param?: string;
  display_name?: string;
}

export type View = 'dashboard' | 'alerts' | 'ventilation' | 'lighting' | 'emergency' | 'reports' | 'settings' | 'users' | 'register';

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
  internalTemp: { value: number; status: StatusLevel; history: number[] };
  externalTemp: { value: number; status: StatusLevel; history: number[] };
  internalHumidity: { value: number; status: StatusLevel; history: number[] };
  externalHumidity: { value: number; status: StatusLevel; history: number[] };
  membraneHealth: { value: string; status: StatusLevel };
  internalNoise: { value: number; status: StatusLevel; history: number[] };
  externalNoise: { value: number; status: StatusLevel; history: number[] };
  basePressure: { value: number; status: StatusLevel; history: number[] };
  internalLux: { value: number; status: StatusLevel; history: number[] };
  lightingStatus: { value: string; status: StatusLevel };
  airShutterStatus: { value: string; status: StatusLevel };
}

export interface Alert {
  id: string;
  siteId: string;
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
    lightsOn: boolean;
    brightness: number;
}

export interface User {
  id: string;
  username: string;
  role: 'Admin' | 'Operator';
  status: 'active' | 'disabled';
  createdAt: string;
}
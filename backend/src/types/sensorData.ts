export interface SensorData {
  id: number;
  pressure: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  timestamp: string;
}

export interface InfluxSensorData {
  _time: string;
  _measurement: string;
  _field: string;
  _value: number;
}

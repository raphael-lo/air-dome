import { InfluxDB, Point } from '@influxdata/influxdb-client';

const url = process.env.INFLUXDB_URL || 'http://localhost:8086';
const token = 'my-super-secret-token';
const org = 'my-org';
const bucket = 'my-bucket';

const influxDB = new InfluxDB({ url, token });
const writeApi = influxDB.getWriteApi(org, bucket);

/**
 * Writes a single metric value to InfluxDB.
 * @param measurement The InfluxDB measurement (e.g., 'sensor_data').
 * @param field The metric field name (e.g., 'internalTemperature').
 * @param value The numeric value of the metric.
 */
export const writeMetric = (measurement: string, field: string, value: number, tags?: Record<string, string>) => {
  const point = new Point(measurement)
    .floatField(field, value)
    .timestamp(new Date()); // Use current server time for the metric

  if (tags) {
    for (const [key, val] of Object.entries(tags)) {
      point.tag(key, val);
    }
  }

  writeApi.writePoint(point);
  // For performance, consider flushing in batches or on an interval
  writeApi.flush(); 
};

// The old function remains for now to ensure no other parts of the app break.
export const writeSensorData = (data: {
  internalPressure: number;
  externalPressure: number;
  internalTemperature: number;
  externalTemperature: number;
  internalHumidity: number;
  externalHumidity: number;
  internalWindSpeed: number;
  externalWindSpeed: number;
  internalPM25: number;
  externalPM25: number;
  internalCO2: number;
  externalCO2: number;
  internalO2: number;
  externalO2: number;
  internalCO: number;
  externalCO: number;
  airExchangeRate: number;
  internalNoise: number;
  externalNoise: number;
  internalLux: number;
  lightingStatus: string;
  basePressure: number;
  fanSpeed: number;
  timestamp: string;
}) => {
  const point = new Point('sensor_data')
    .floatField('internalPressure', data.internalPressure)
    .floatField('externalPressure', data.externalPressure)
    .floatField('internalTemperature', data.internalTemperature)
    .floatField('externalTemperature', data.externalTemperature)
    .floatField('internalHumidity', data.internalHumidity)
    .floatField('externalHumidity', data.externalHumidity)
    .floatField('internalWindSpeed', data.internalWindSpeed)
    .floatField('externalWindSpeed', data.externalWindSpeed)
    .floatField('internalPM25', data.internalPM25)
    .floatField('externalPM25', data.externalPM25)
    .floatField('internalCO2', data.internalCO2)
    .floatField('externalCO2', data.externalCO2)
    .floatField('internalO2', data.internalO2)
    .floatField('externalO2', data.externalO2)
    .floatField('internalCO', data.internalCO)
    .floatField('externalCO', data.externalCO)
    .floatField('airExchangeRate', data.airExchangeRate)
    .floatField('internalNoise', data.internalNoise)
    .floatField('externalNoise', data.externalNoise)
    .floatField('internalLux', data.internalLux)
    .stringField('lightingStatus', data.lightingStatus)
    .floatField('basePressure', data.basePressure)
    .floatField('fanSpeed', data.fanSpeed)
    .timestamp(new Date(data.timestamp));
  writeApi.writePoint(point);
  writeApi.flush();
};

export const querySensorData = async (range: string = '-1h') => {
    const queryApi = influxDB.getQueryApi(org);
    const query = `from(bucket: "${bucket}") |> range(start: ${range}) |> filter(fn: (r) => r._measurement == "sensor_data")`;
    const result = await queryApi.collectRows(query);
    return result;
    }


const getRangeInMinutes = (range: string): number => {
  const value = parseInt(range.slice(1, -1)); // Remove '-' and 'm'/'h'
  const unit = range.slice(-1);
  if (unit === 'm') {
    return value;
  } else if (unit === 'h') {
    return value * 60;
  }
  return 0; // Should not happen with valid ranges
};

const getRangeInSeconds = (range: string): number => {
  const value = parseInt(range.slice(1, -1)); // Remove '-' and 'm'/'h'
  const unit = range.slice(-1);
  if (unit === 'm') {
    return value * 60;
  } else if (unit === 'h') {
    return value * 60 * 60;
  }
  return 0; // Should not happen with valid ranges
};

export const queryHistoricalData = async (measurement: string, field: string, range: string = '-24h', maxPoints: number = 40) => {
  const queryApi = influxDB.getQueryApi(org);

  const rangeSeconds = getRangeInSeconds(range);
  let every = `${Math.max(1, Math.floor(rangeSeconds / maxPoints))}s`; // Ensure at least 1 minute interval

  // Adjust 'every' for very short ranges to avoid 0 or too small intervals
  if (rangeSeconds < maxPoints) {
    every = '1m'; // For ranges smaller than maxPoints, aggregate by 1 minute
  }

  const query = `
    from(bucket: "${bucket}")
    |> range(start: ${range})
    |> filter(fn: (r) => r._measurement == "${measurement}" and r._field == "${field}")
    |> aggregateWindow(every: ${every}, fn: mean, createEmpty: true)
    |> yield(name: "mean")
  `;
  const result = await queryApi.collectRows(query);
  return result.map((row: any) => ({ _time: row._time, _value: row._value }));
};
import { InfluxDB, Point } from '@influxdata/influxdb-client';

const url = process.env.INFLUXDB_URL || 'http://localhost:8086';
const token = process.env.INFLUXDB_TOKEN || 'my-super-secret-token';
const org = process.env.INFLUXDB_ORG || 'my-org';
const bucket = process.env.INFLUXDB_BUCKET || 'my-bucket';

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

export function queryHistoricalData(measurement: string, field: string, range?: string, maxPoints?: number): Promise<any[]>;
export function queryHistoricalData(measurement: string, field: string, range: string, topic: string, device_id: string, maxPoints?: number): Promise<any[]>;
export async function queryHistoricalData(measurement: string, field: string, range: string = '-24h', maxPointsOrTopic?: number | string, device_id?: string, maxPoints?: number): Promise<any[]> {
    const queryApi = influxDB.getQueryApi(org);

    let topic: string | undefined;
    let actualMaxPoints: number = 40;

    if (typeof maxPointsOrTopic === 'string') {
        topic = maxPointsOrTopic;
        actualMaxPoints = maxPoints || 40;
    } else if (typeof maxPointsOrTopic === 'number') {
        actualMaxPoints = maxPointsOrTopic;
    }

    const rangeSeconds = getRangeInSeconds(range);
    let every = `${Math.max(1, Math.floor(rangeSeconds / actualMaxPoints))}s`;

    if (rangeSeconds < actualMaxPoints) {
        every = '1m';
    }

    let query = `
    from(bucket: "${bucket}")
    |> range(start: ${range})
    |> filter(fn: (r) => r._measurement == "${measurement}" and r._field == "${field}")`;

    if (topic && device_id) {
        query += `
    |> filter(fn: (r) => r.topic == "${topic}" and r.device_id == "${device_id}")`;
    }

    query += `
    |> aggregateWindow(every: ${every}, fn: mean, createEmpty: true)
    |> yield(name: "mean")
  `;
    const result = await queryApi.collectRows(query);
    return result.map((row: any) => ({ _time: row._time, _value: row._value }));
}
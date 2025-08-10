
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.INFLUXDB_URL || '';
const token = process.env.INFLUXDB_TOKEN || '';
const org = process.env.INFLUXDB_ORG || '';
const bucket = process.env.INFLUXDB_BUCKET || '';

const influxDB = new InfluxDB({ url, token });
const writeApi = influxDB.getWriteApi(org, bucket);

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


export const queryHistoricalData = async (measurement: string, field: string, range: string = '-24h') => {
  const queryApi = influxDB.getQueryApi(org);
  const query = `
    from(bucket: "${bucket}")
    |> range(start: ${range})
    |> filter(fn: (r) => r._measurement == "${measurement}" and r._field == "${field}")
    |> yield(name: "mean")
  `;
  const result = await queryApi.collectRows(query);
  return result.map((row: any) => row._value);
};

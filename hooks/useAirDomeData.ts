import { useState, useEffect, useRef } from 'react';
import type { AirDomeData, Site } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusLevel } from '../types';

const BASE_URL = 'http://localhost:3001/api';
const WS_URL = 'ws://localhost:3001';

export const useAirDomeData = (site: Site, authenticatedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) => {
  const [data, setData] = useState<AirDomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const setDataRef = useRef(setData);

  useEffect(() => {
    setDataRef.current = setData;
  }, [setData]);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      const metricsToFetch = [
        { key: 'internalPressure', measurement: 'sensor_data', field: 'internalPressure' },
        { key: 'externalPressure', measurement: 'sensor_data', field: 'externalPressure' },
        { key: 'fanSpeed', measurement: 'sensor_data', field: 'fanSpeed' },
        { key: 'airExchangeRate', measurement: 'sensor_data', field: 'airExchangeRate' },
        { key: 'externalWindSpeed', measurement: 'sensor_data', field: 'externalWindSpeed' },
        { key: 'internalPM25', measurement: 'sensor_data', field: 'internalPM25' },
        { key: 'externalPM25', measurement: 'sensor_data', field: 'externalPM25' },
        { key: 'internalCO2', measurement: 'sensor_data', field: 'internalCO2' },
        { key: 'externalCO2', measurement: 'sensor_data', field: 'externalCO2' },
        { key: 'internalO2', measurement: 'sensor_data', field: 'internalO2' },
        { key: 'externalO2', measurement: 'sensor_data', field: 'externalO2' },
        { key: 'internalCO', measurement: 'sensor_data', field: 'internalCO' },
        { key: 'externalCO', measurement: 'sensor_data', field: 'externalCO' },
        { key: 'internalTemp', measurement: 'sensor_data', field: 'internalTemperature' },
        { key: 'externalTemp', measurement: 'sensor_data', field: 'externalTemperature' },
        { key: 'internalHumidity', measurement: 'sensor_data', field: 'internalHumidity' },
        { key: 'externalHumidity', measurement: 'sensor_data', field: 'externalHumidity' },
        { key: 'internalNoise', measurement: 'sensor_data', field: 'internalNoise' },
        { key: 'externalNoise', measurement: 'sensor_data', field: 'externalNoise' },
        { key: 'basePressure', measurement: 'sensor_data', field: 'basePressure' },
        { key: 'internalLux', measurement: 'sensor_data', field: 'internalLux' },
      ];

      const initialData: AirDomeData = {
        internalPressure: { value: 0, status: StatusLevel.Ok, history: [] },
        externalPressure: { value: 0, status: StatusLevel.Ok, history: [] },
        fanSpeed: { value: 0, status: StatusLevel.Ok, history: [] },
        airExchangeRate: { value: 0, status: StatusLevel.Ok, history: [] },
        powerConsumption: { value: 0, status: StatusLevel.Ok, history: [] },
        voltage: { value: 0, status: StatusLevel.Ok, history: [] },
        current: { value: 0, status: StatusLevel.Ok, history: [] },
        externalWindSpeed: { value: 0, status: StatusLevel.Ok, history: [] },
        internalPM25: { value: 0, status: StatusLevel.Ok, history: [] },
        externalPM25: { value: 0, status: StatusLevel.Ok, history: [] },
        internalCO2: { value: 0, status: StatusLevel.Ok, history: [] },
        externalCO2: { value: 0, status: StatusLevel.Ok, history: [] },
        internalO2: { value: 0, status: StatusLevel.Ok, history: [] },
        externalO2: { value: 0, status: StatusLevel.Ok, history: [] },
        internalCO: { value: 0, status: StatusLevel.Ok, history: [] },
        externalCO: { value: 0, status: StatusLevel.Ok, history: [] },
        internalTemp: { value: 0, status: StatusLevel.Ok, history: [] },
        externalTemp: { value: 0, status: StatusLevel.Ok, history: [] },
        internalHumidity: { value: 0, status: StatusLevel.Ok, history: [] },
        externalHumidity: { value: 0, status: StatusLevel.Ok, history: [] },
        membraneHealth: { value: 'Normal', status: StatusLevel.Ok },
        internalNoise: { value: 0, status: StatusLevel.Ok, history: [] },
        externalNoise: { value: 0, status: StatusLevel.Ok, history: [] },
        basePressure: { value: 0, status: StatusLevel.Ok, history: [] },
        internalLux: { value: 0, status: StatusLevel.Ok, history: [] },
        lightingStatus: { value: 'Off', status: StatusLevel.Ok },
        airShutterStatus: { value: 'Closed', status: StatusLevel.Ok },
      };

      const historyPromises = metricsToFetch.map(async (metric) => {
        try {
          const response = await authenticatedFetch(`${BASE_URL}/sensor-data/history?measurement=${metric.measurement}&field=${metric.field}&range=-24h`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const historyData = await response.json();
          return { key: metric.key, history: historyData };
        } catch (error) {
          console.error(`Error fetching historical data for ${metric.key}:`, error);
          return { key: metric.key, history: [] };
        }
      });

      const histories = await Promise.all(historyPromises);

      setDataRef.current((prevData) => {
        const dataToUpdate = prevData || initialData;
        const updatedData = { ...dataToUpdate };

        histories.forEach(({ key, history }) => {
          if (updatedData[key] && updatedData[key].history) {
            updatedData[key].history = history;
            if (history.length > 0) {
              updatedData[key].value = history[history.length - 1]; // Set current value to the latest historical data
            }
          }
        });
        return updatedData;
      });
      setIsLoading(false);
    };

    fetchHistoricalData();

    console.log('Starting WebSocket connection...');
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('Connected to WebSocket');
    };

    ws.onmessage = (event) => {
      console.log('Received message:', event.data);
      const newData = JSON.parse(event.data);
      setDataRef.current((prevData) => {
        if (!prevData) return prevData; // Should not happen after initial fetch

        const updatedData = { ...prevData };
        for (const key in newData) {
          if (key !== 'timestamp' && updatedData[key] && updatedData[key].history) {
            updatedData[key].value = newData[key];
            updatedData[key].history.push(newData[key]);
            // Optionally, limit history length to avoid excessive memory usage
            // if (updatedData[key].history.length > 100) {
            //   updatedData[key].history.shift();
            // }
          } else if (key !== 'timestamp' && updatedData[key]) {
            // For non-history metrics like membraneHealth, lightingStatus, airShutterStatus
            updatedData[key].value = newData[key];
          }
        }
        return updatedData;
      });
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = (event) => {
      console.log('Disconnected from WebSocket:', event);
    };

    return () => {
      console.log('Closing WebSocket connection...');
      ws.close();
    };
  }, [site, authenticatedFetch]);

  return { data, isLoading };
};
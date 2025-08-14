import { useState, useEffect, useRef } from 'react';
import type { AirDomeData, Site } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusLevel } from '../types';
import { config } from '../config';

const BASE_URL = config.apiBaseUrl;
const WS_URL = config.wsUrl;

export const useAirDomeData = (site: Site, authenticatedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) => {
  const [data, setData] = useState<AirDomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null); // New state
  const setDataRef = useRef(setData);
  const wsRef = useRef<WebSocket | null>(null); // New ref for WebSocket

  useEffect(() => {
    setDataRef.current = setData;
  }, [setData]);

  useEffect(() => {
    const selectedPeriod = '-24h';
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
        { key: 'internalTemperature', measurement: 'sensor_data', field: 'internalTemperature' },
        { key: 'externalTemperature', measurement: 'sensor_data', field: 'externalTemperature' },
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
        internalTemperature: { value: 0, status: StatusLevel.Ok, history: [] },
        externalTemperature: { value: 0, status: StatusLevel.Ok, history: [] },
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
        console.log(`Fetching historical data for: ${metric.measurement}.${metric.field}`);
        try {
          const response = await authenticatedFetch(`${BASE_URL}/sensor-data/history?measurement=${metric.measurement}&field=${metric.field}&range=${selectedPeriod}`);
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

      // Create a new AirDomeData object based on initialData
      const newAirDomeData: AirDomeData = { ...initialData };

      histories.forEach(({ key, history }) => {
        if (newAirDomeData[key] && newAirDomeData[key].history) {
          newAirDomeData[key].history = history;
          if (history.length > 0) {
            const lastPoint = history[history.length - 1];
            if (lastPoint) {
                newAirDomeData[key].value = lastPoint._value;
            }
          }
        }
      });
      setData(newAirDomeData); // Directly set the data
      setIsLoading(false);
    };

    fetchHistoricalData();

    // WebSocket connection logic
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      console.log('Starting WebSocket connection...');
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('Connected to WebSocket');
      };

      ws.onmessage = (event) => {
        console.log('Received message:', event.data);
        const newData = JSON.parse(event.data);
        setDataRef.current((prevData) => {
          if (!prevData) return prevData;

          const updatedData = { ...prevData };
          const maxPoints = 40;

          for (const key in newData) {
            if (key !== 'timestamp' && updatedData[key] && updatedData[key].history) {
              updatedData[key].value = newData[key];
              const newHistory = [...updatedData[key].history, newData[key]];
              if (newHistory.length > maxPoints) {
                newHistory.shift();
              }
              updatedData[key].history = newHistory;
            } else if (key !== 'timestamp' && updatedData[key]) {
              updatedData[key].value = newData[key];
            }
          }
          if (newData.timestamp) {
            setLastUpdated(newData.timestamp);
            updatedData.timestamp = newData.timestamp; // Add this line
          }
          return updatedData;
        });
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
      };

      ws.onclose = (event) => {
        console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
        wsRef.current = null; // Clear ref on close
      };

      wsRef.current = ws; // Store WebSocket instance in ref
    }

    return () => {
      console.log('Closing WebSocket connection...');
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        wsRef.current.close();
        wsRef.current = null; // Clear ref on cleanup
      }
    };
  }, [site, authenticatedFetch]);

  return { data, isLoading, lastUpdated };
};
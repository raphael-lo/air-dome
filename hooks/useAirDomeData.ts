import { useState, useEffect, useRef } from 'react';
import type { Site, AlertThreshold, Metric } from '../backend/src/types';
import { StatusLevel } from '../backend/src/types';
import { config } from '../config';

const BASE_URL = config.apiBaseUrl;
const WS_URL = config.wsUrl;

// This helper function is now only used for the initial data load.
const getStatusForMetric = (value: number, threshold: AlertThreshold | undefined): StatusLevel => {
  if (!threshold) return StatusLevel.Ok;
  const { min_warning, max_warning, min_alert, max_alert } = threshold;
  if (min_alert !== null && value <= min_alert) return StatusLevel.Danger;
  if (max_alert !== null && value >= max_alert) return StatusLevel.Danger;
  if (min_warning !== null && value <= min_warning) return StatusLevel.Warn;
  if (max_warning !== null && value >= max_warning) return StatusLevel.Warn;
  return StatusLevel.Ok;
};

// The data type is now dynamic, allowing any string key.
export type DynamicAirDomeData = Record<string, any>;

export const useAirDomeData = (site: Site, authenticatedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>, onNewAlert: (payload: any) => void) => {
  const [data, setData] = useState<DynamicAirDomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const setDataRef = useRef(setData);
  const wsRef = useRef<WebSocket | null>(null);
  const onNewAlertRef = useRef(onNewAlert);

  useEffect(() => {
    setDataRef.current = setData;
  }, [setData]);

  useEffect(() => {
    onNewAlertRef.current = onNewAlert;
  }, [onNewAlert]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);

      // Fetch all defined metrics and their alert thresholds
      const [metricsResponse, thresholdsResponse] = await Promise.all([
        authenticatedFetch(`${BASE_URL}/metrics`),
        authenticatedFetch(`${BASE_URL}/alert-thresholds/${site.id}`),
      ]);

      if (!metricsResponse.ok || !thresholdsResponse.ok) {
        console.error('Failed to fetch initial data');
        setIsLoading(false);
        return;
      }

      const metrics: Metric[] = await metricsResponse.json();
      const fetchedThresholds: AlertThreshold[] = await thresholdsResponse.json();
      
      const thresholdsMap: Record<string, AlertThreshold> = {};
      const metricIdToMqttParam: Record<number, string> = {};
      metrics.forEach(m => {
        if(m.id && m.mqtt_param) metricIdToMqttParam[m.id] = m.mqtt_param;
      });
      fetchedThresholds.forEach(t => {
        const mqttParam = metricIdToMqttParam[t.metric_id];
        if (mqttParam) {
          thresholdsMap[mqttParam] = t;
        }
      });

      // Fetch historical data for all defined metrics
      const historyPromises = metrics.map(async (metric) => {
        if (!metric.mqtt_param) return null;
        try {
          const response = await authenticatedFetch(`${BASE_URL}/sensor-data/history?measurement=sensor_data&field=${metric.mqtt_param}&range=-24h`);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const historyData = await response.json();
          return { key: metric.mqtt_param, history: historyData };
        } catch (error) {
          console.error(`Error fetching historical data for ${metric.mqtt_param}:`, error);
          return { key: metric.mqtt_param, history: [] };
        }
      }).filter(p => p !== null);

      const histories = await Promise.all(historyPromises as Promise<{key: string, history: any[]}>[]);

      // Dynamically build the initial data object from the metrics defined in the database
      const initialData: DynamicAirDomeData = {};
      metrics.forEach(metric => {
        if (metric.mqtt_param) {
            initialData[metric.mqtt_param] = { value: 'N/A', status: StatusLevel.Ok, history: [] };
        }
      });

      histories.forEach((historyResult) => {
        if (historyResult && initialData[historyResult.key]) {
          initialData[historyResult.key].history = historyResult.history;
          if (historyResult.history.length > 0) {
            const lastPoint = historyResult.history[historyResult.history.length - 1];
            if (lastPoint) {
                const value = lastPoint._value;
                initialData[historyResult.key].value = value;
                initialData[historyResult.key].status = getStatusForMetric(value, thresholdsMap[historyResult.key]);
            }
          }
        }
      });
      
      setData(initialData);
      setIsLoading(false);
    };

    fetchInitialData();

    // --- WebSocket Logic ---
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      const ws = new WebSocket(WS_URL);
      ws.onopen = () => {};

      ws.onmessage = (event) => {
        const newData = JSON.parse(event.data);
        
        if (newData.type === 'new_alert' || newData.type === 'alert_status_updated') {
            onNewAlertRef.current(newData);
        } else {
            setDataRef.current((prevData) => {
              if (!prevData) return null;

              const updatedData = { ...prevData };
              const maxPoints = 40;

              for (const key in newData) {
                if (key === 'timestamp') continue;

                const { value, status } = newData[key];
                
                // If the metric key doesn't exist on our state, create it dynamically
                if (!updatedData[key]) {
                    updatedData[key] = { value: 0, status: StatusLevel.Ok, history: [] };
                }
                
                updatedData[key].value = value;
                updatedData[key].status = status;

                if (updatedData[key].history) {
                    const newHistory = [...updatedData[key].history, { _time: new Date().toISOString(), _value: value }];
                    if (newHistory.length > maxPoints) {
                      newHistory.shift();
                    }
                    updatedData[key].history = newHistory;
                }
              }

              if (newData.timestamp) {
                setLastUpdated(newData.timestamp);
                updatedData.timestamp = newData.timestamp;
              }
              return updatedData;
            });
        }
      };

      ws.onerror = (event) => console.error('WebSocket error:', event);
      ws.onclose = () => { wsRef.current = null; };
      wsRef.current = ws;
    }

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [site, authenticatedFetch]);

  return { data, isLoading, lastUpdated };
};
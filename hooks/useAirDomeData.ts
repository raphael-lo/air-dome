import { useState, useEffect, useRef } from 'react';
import type { AirDomeData, Site, AlertThreshold, Metric } from '../backend/src/types';
import { useAuth } from '../context/AuthContext';
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

export const useAirDomeData = (site: Site, authenticatedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>, onNewAlert: (payload: any) => void) => {
  const [data, setData] = useState<AirDomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const setDataRef = useRef(setData);
  const wsRef = useRef<WebSocket | null>(null);
  const onNewAlertRef = useRef((payload: any) => {});

  useEffect(() => {
    setDataRef.current = setData;
  }, [setData]);

  useEffect(() => {
    onNewAlertRef.current = onNewAlert;
  }, [onNewAlert]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);

      const [metricsResponse, thresholdsResponse] = await Promise.all([
        authenticatedFetch(`${BASE_URL}/metrics`),
        authenticatedFetch(`${BASE_URL}/alert-thresholds/${site.id}`)
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
        if(m.id) metricIdToMqttParam[m.id] = m.mqtt_param;
      });
      fetchedThresholds.forEach(t => {
        const mqttParam = metricIdToMqttParam[t.metric_id];
        if (mqttParam) {
          thresholdsMap[mqttParam] = t;
        }
      });

      const selectedPeriod = '-24h';
      const metricsToFetch = metrics.map(m => ({ key: m.mqtt_param, measurement: 'sensor_data', field: m.mqtt_param }));

      const initialData: AirDomeData = {
        timestamp: "",
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
        try {
          const response = await authenticatedFetch(`${BASE_URL}/sensor-data/history?measurement=${metric.measurement}&field=${metric.field}&range=${selectedPeriod}`);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const historyData = await response.json();
          return { key: metric.key, history: historyData };
        } catch (error) {
          console.error(`Error fetching historical data for ${metric.key}:`, error);
          return { key: metric.key, history: [] };
        }
      });

      const histories = await Promise.all(historyPromises);

      const newAirDomeData: AirDomeData = { ...initialData };

      histories.forEach(({ key, history }) => {
        if (newAirDomeData[key] && newAirDomeData[key].history) {
          newAirDomeData[key].history = history;
          if (history.length > 0) {
            const lastPoint = history[history.length - 1];
            if (lastPoint) {
                const value = lastPoint._value;
                newAirDomeData[key].value = value;
                newAirDomeData[key].status = getStatusForMetric(value, thresholdsMap[key]);
            }
          }
        }
      });
      setData(newAirDomeData);
      setIsLoading(false);
    };

    fetchInitialData();

    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      const ws = new WebSocket(WS_URL);
      ws.onopen = () => {};

      ws.onmessage = (event) => {
        const newData = JSON.parse(event.data);
        
        // Handle new alert broadcasts
        if (newData.type === 'new_alert') {
            onNewAlertRef.current({ type: 'new_alert', payload: newData.payload });
        } else if (newData.type === 'alert_status_updated') {
            onNewAlertRef.current({ type: 'alert_status_updated', payload: newData.payload });
        } else {
            setDataRef.current((prevData) => {
          if (!prevData) return prevData;

          const updatedData = { ...prevData };
          const maxPoints = 40;

          for (const key in newData) {
            if (key !== 'timestamp' && updatedData[key]) {
              const { value, status } = newData[key];
              
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
          }
          if (newData.timestamp) {
            setLastUpdated(newData.timestamp);
            updatedData.timestamp = newData.timestamp;
          }
          return updatedData;
        });
      };

      ws.onerror = (event) => console.error('WebSocket error:', event);
      ws.onclose = (event) => {
        wsRef.current = null;
      };
      wsRef.current = ws;
      }

    return () => {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        wsRef.current.close();
        wsRef.current = null;
      }
      };
    }
  }, [site, authenticatedFetch]);

  return { data, isLoading, lastUpdated };
};
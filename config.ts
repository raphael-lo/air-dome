// /config.ts
const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const VITE_WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export const config = {
  apiBaseUrl: VITE_API_BASE_URL,
  wsUrl: VITE_WS_URL,
};

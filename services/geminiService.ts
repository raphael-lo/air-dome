import { GoogleGenAI } from "@google/genai";
import type { AirDomeData, Alert, FanSet, LightingState, User } from '../types';
import { StatusLevel } from '../types';
import { initialMockAlerts } from '../constants';

// IMPORTANT: This check is for the web demo environment.
// In a real application, the API key would be securely managed.
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function* analyzeDomeDataStream(data: AirDomeData, lang: 'en' | 'zh'): AsyncGenerator<string> {
  const languageInstruction = lang === 'zh' 
    ? "請用繁體中文回答。" 
    : "Please respond in English.";

  const prompt = `
    You are an expert AI system for analyzing the health and operational status of an Air Dome structure.
    Based on the following real-time sensor data, provide a concise, clear, and actionable analysis.
    Your analysis should have two two parts:
    1.  **Overall Summary:** A brief, one-paragraph overview of the dome's current status.
    2.  **Key Observations & Recommendations:** A bulleted list of 2-3 most important points. Focus on any values that are nearing warning/danger thresholds or any interesting correlations. Provide simple, actionable recommendations.

    Do not just list the data. Interpret it. Behave like an experienced facility manager.
    ${languageInstruction}

    Current Sensor Data:
    \`\`\`json
    ${JSON.stringify(data, null, 2)}
    \`\`\`
  `;

  try {
    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    for await (const chunk of stream) {
      yield chunk.text;
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    yield lang === 'zh' ? "AI 分析時發生錯誤。請稍後再試。" : "An error occurred during AI analysis. Please try again later.";
  }
}


// --- REAL BACKEND INTEGRATION ---

const BASE_URL = 'http://localhost:3001/api';

interface AuthenticatedFetch {
  authenticatedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export const fetchAlerts = async (siteId: string, { authenticatedFetch }: AuthenticatedFetch): Promise<Alert[]> => {
  const response = await authenticatedFetch(`${BASE_URL}/alerts?siteId=${siteId}`);
  if (!response.ok) throw new Error('Failed to fetch alerts');
  return response.json();
};

export const acknowledgeAlert = async (alertId: string, { authenticatedFetch }: AuthenticatedFetch): Promise<Alert> => {
  const response = await authenticatedFetch(`${BASE_URL}/alerts/${alertId}/acknowledge`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to acknowledge alert');
  return response.json();
};

export const fetchFanSets = async ({ authenticatedFetch }: AuthenticatedFetch): Promise<FanSet[]> => {
  const response = await authenticatedFetch(`${BASE_URL}/fan-sets`);
  if (!response.ok) throw new Error('Failed to fetch fan sets');
  return response.json();
};

export const updateFanSet = async (id: string, updates: Partial<Omit<FanSet, 'id' | 'name'>>, { authenticatedFetch }: AuthenticatedFetch): Promise<FanSet> => {
  const response = await authenticatedFetch(`${BASE_URL}/fan-sets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update fan set');
  return response.json();
};

export const fetchLightingState = async ({ authenticatedFetch }: AuthenticatedFetch): Promise<LightingState> => {
  const response = await authenticatedFetch(`${BASE_URL}/lighting-state`);
  if (!response.ok) throw new Error('Failed to fetch lighting state');
  return response.json();
};

export const updateLightingState = async (updates: Partial<LightingState>, { authenticatedFetch }: AuthenticatedFetch): Promise<LightingState> => {
  const response = await authenticatedFetch(`${BASE_URL}/lighting-state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update lighting state');
  return response.json();
};

export const fetchUsers = async ({ authenticatedFetch }: AuthenticatedFetch): Promise<User[]> => {
  const response = await authenticatedFetch(`${BASE_URL}/users`);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

export const createUser = async (userData: { username: string, password: string, role: 'Admin' | 'Operator' }, { authenticatedFetch }: AuthenticatedFetch): Promise<User> => {
  const response = await authenticatedFetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!response.ok) throw new Error('Failed to create user');
  return response.json();
};

export const updateUserStatus = async (userId: string, status: 'active' | 'disabled', { authenticatedFetch }: AuthenticatedFetch): Promise<User> => {
  const response = await authenticatedFetch(`${BASE_URL}/users/${userId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update user status');
  return response.json();
};

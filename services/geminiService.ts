import type { AirDomeData, Alert, FanSet, LightingState, User, Metric, MetricGroup, Section, SectionItem } from '../backend/src/types';
import { StatusLevel } from '../backend/src/types';
import { initialMockAlerts } from '../constants';

export async function* analyzeDomeDataStream(data: AirDomeData, lang: 'en' | 'zh', { authenticatedFetch }: AuthenticatedFetch): AsyncGenerator<string> {
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
    const response = await authenticatedFetch(`${BASE_URL}/analyze-dome-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, lang, prompt }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get AI analysis: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Failed to get readable stream from response.");

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process chunks as they arrive (assuming server sends newline-delimited JSON or plain text chunks)
      // For plain text streaming, we can yield directly
      yield buffer;
      buffer = ''; // Clear buffer after yielding
    }

  } catch (error) {
    console.error("Error calling backend AI proxy:", error);
    yield lang === 'zh' ? "AI 分析時發生錯誤。請稍後再試。" : "An error occurred during AI analysis. Please try again later.";
  }
}


// --- REAL BACKEND INTEGRATION ---

import { config } from '../config';

const BASE_URL = config.apiBaseUrl;

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

export const createUser = async (userData: { username: string, password: string, role: 'Admin' | 'Operator' | 'Viewer' }, { authenticatedFetch }: AuthenticatedFetch): Promise<User> => {
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

export const updateUser = async (userId: string, userData: { username?: string, password?: string, role?: 'Admin' | 'Operator' | 'Viewer' }, { authenticatedFetch }: AuthenticatedFetch): Promise<User> => {
  const response = await authenticatedFetch(`${BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!response.ok) throw new Error('Failed to update user');
  return response.json();
};

export const fetchMetrics = async ({ authenticatedFetch }: AuthenticatedFetch): Promise<Metric[]> => {
  const response = await authenticatedFetch(`${BASE_URL}/metrics`);
  if (!response.ok) throw new Error('Failed to fetch metrics');
  return response.json();
};

export const createMetric = async (metricData: Omit<Metric, 'id'>, { authenticatedFetch }: AuthenticatedFetch): Promise<Metric> => {
  const response = await authenticatedFetch(`${BASE_URL}/metrics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metricData),
  });
  if (!response.ok) throw new Error('Failed to create metric');
  return response.json();
};

export const updateMetric = async (metricId: number, metricData: Partial<Omit<Metric, 'id'>>, { authenticatedFetch }: AuthenticatedFetch): Promise<Metric> => {
  const response = await authenticatedFetch(`${BASE_URL}/metrics/${metricId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metricData),
  });
  if (!response.ok) throw new Error('Failed to update metric');
  return response.json();
};

export const deleteMetric = async (metricId: number, { authenticatedFetch }: AuthenticatedFetch): Promise<void> => {
  const response = await authenticatedFetch(`${BASE_URL}/metrics/${metricId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete metric');
};

export const fetchMetricGroups = async ({ authenticatedFetch }: AuthenticatedFetch): Promise<MetricGroup[]> => {
  const response = await authenticatedFetch(`${BASE_URL}/metric-groups`);
  if (!response.ok) throw new Error('Failed to fetch metric groups');
  return response.json();
};

export const createMetricGroup = async (metricGroupData: Omit<MetricGroup, 'id'>, { authenticatedFetch }: AuthenticatedFetch): Promise<MetricGroup> => {
  const response = await authenticatedFetch(`${BASE_URL}/metric-groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metricGroupData),
  });
  if (!response.ok) throw new Error('Failed to create metric group');
  return response.json();
};

export const updateMetricGroup = async (metricGroupId: number, metricGroupData: Partial<Omit<MetricGroup, 'id'>>, { authenticatedFetch }: AuthenticatedFetch): Promise<MetricGroup> => {
  const response = await authenticatedFetch(`${BASE_URL}/metric-groups/${metricGroupId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metricGroupData),
  });
  if (!response.ok) throw new Error('Failed to update metric group');
  return response.json();
};

export const deleteMetricGroup = async (metricGroupId: number, { authenticatedFetch }: AuthenticatedFetch): Promise<void> => {
  const response = await authenticatedFetch(`${BASE_URL}/metric-groups/${metricGroupId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete metric group');
};

export const fetchSections = async ({ authenticatedFetch }: AuthenticatedFetch): Promise<Section[]> => {
  const response = await authenticatedFetch(`${BASE_URL}/sections`);
  if (!response.ok) throw new Error('Failed to fetch sections');
  return response.json();
};

export const createSection = async (sectionData: Omit<Section, 'id' | 'items'>, { authenticatedFetch }: AuthenticatedFetch): Promise<Section> => {
  const response = await authenticatedFetch(`${BASE_URL}/sections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sectionData),
  });
  if (!response.ok) throw new Error('Failed to create section');
  return response.json();
};

export const updateSection = async (sectionId: number, sectionData: Partial<Omit<Section, 'id' | 'items'>>, { authenticatedFetch }: AuthenticatedFetch): Promise<Section> => {
  const response = await authenticatedFetch(`${BASE_URL}/sections/${sectionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sectionData),
  });
  if (!response.ok) throw new Error('Failed to update section');
  return response.json();
};

export const deleteSection = async (sectionId: number, { authenticatedFetch }: AuthenticatedFetch): Promise<void> => {
  const response = await authenticatedFetch(`${BASE_URL}/sections/${sectionId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete section');
};

export const updateSectionOrder = async (sections: { id: number, item_order: number }[], { authenticatedFetch }: AuthenticatedFetch): Promise<void> => {
  const response = await authenticatedFetch(`${BASE_URL}/sections/order`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sections),
  });
  if (!response.ok) throw new Error('Failed to update section order');
};

export const fetchSectionItems = async (sectionId: number, { authenticatedFetch }: AuthenticatedFetch): Promise<SectionItem[]> => {
  const response = await authenticatedFetch(`${BASE_URL}/sections/${sectionId}/items`);
  if (!response.ok) throw new Error('Failed to fetch section items');
  return response.json();
};

export const addSectionItem = async (sectionId: number, item: Omit<SectionItem, 'id' | 'section_id'>, { authenticatedFetch }: AuthenticatedFetch): Promise<SectionItem> => {
  console.log('addSectionItem called with:', { sectionId, item });
  const url = `${BASE_URL}/sections/${sectionId}/items`;
  console.log('addSectionItem URL:', url);
  const response = await authenticatedFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  console.log('addSectionItem response status:', response.status);
  console.log('addSectionItem response ok:', response.ok);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('addSectionItem error response body:', errorText);
    throw new Error(`Failed to add item to section: ${response.status} ${response.statusText} - ${errorText}`);
  }
  return response.json();
};

export const removeSectionItem = async (sectionId: number, itemId: number, { authenticatedFetch }: AuthenticatedFetch): Promise<void> => {
  const response = await authenticatedFetch(`${BASE_URL}/sections/${sectionId}/items/${itemId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to remove item from section');
};

export const updateSectionItems = async (sectionId: number, items: SectionItem[], { authenticatedFetch }: AuthenticatedFetch): Promise<void> => {
  const response = await authenticatedFetch(`${BASE_URL}/sections/${sectionId}/items/order`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  });
  if (!response.ok) throw new Error('Failed to update section item order');
};
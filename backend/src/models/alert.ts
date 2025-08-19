export interface Alert {
  id: string;
  site_id: string;
  parameter_key: string; // Changed from 'parameter'
  message_key: string;   // Changed from 'message'
  message_params: Record<string, any>; // New field for message parameters
  severity: 'Ok' | 'Warn' | 'Danger';
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

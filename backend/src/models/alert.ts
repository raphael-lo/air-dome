export interface Alert {
  id: string;
  site_id: string;
  parameter: string;
  message: string;
  severity: 'Ok' | 'Warn' | 'Danger';
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

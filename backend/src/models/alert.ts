export interface Alert {
  id: string;
  siteId: string;
  parameter: string;
  message: string;
  severity: 'Ok' | 'Warn' | 'Danger';
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

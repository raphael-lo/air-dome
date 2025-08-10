export interface FanSet {
  id: string;
  name: string;
  status: 'on' | 'off';
  mode: 'auto' | 'manual';
  inflow: number;
  outflow: number;
}

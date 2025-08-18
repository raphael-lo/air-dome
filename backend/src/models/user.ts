export interface User {
  id?: number;
  username: string;
  password: string;
  role?: 'Admin' | 'Operator' | 'Viewer';
  status?: 'active' | 'disabled';
  created_at?: string;
}

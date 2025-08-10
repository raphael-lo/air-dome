export interface User {
  id?: number;
  username: string;
  password: string;
  role?: 'Admin' | 'Operator';
  status?: 'active' | 'disabled';
  createdAt?: string;
}

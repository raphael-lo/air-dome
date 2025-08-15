import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import type { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  login: (user: string, pass: string) => Promise<void>;
  logout: () => void;
  authenticatedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

import { config } from '../config';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Invalid token', e);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [token]);

  const login = async (user: string, pass: string): Promise<void> => {
    const response = await fetch(`${config.apiBaseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: user, password: pass }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const { token: newToken } = await response.json();
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const authenticatedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(input, { ...init, headers });
  };

  const value = useMemo(() => ({
    isAuthenticated,
    token,
    user,
    login,
    logout,
    authenticatedFetch,
  }), [isAuthenticated, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};

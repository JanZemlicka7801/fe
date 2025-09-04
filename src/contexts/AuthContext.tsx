import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';

export type Role = 'LEARNER' | 'INSTRUCTOR' | 'ADMIN';

export interface LearnerMini {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phoneNumber?: string | null;
  lessons?: number | null;
}

export interface User {
  id: string;
  role: Role;
  validated: boolean;
  username?: string;        // <- added
  email?: string;           // <- added
  learner?: LearnerMini | null;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  setError: (msg: string | null) => void;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser) as User);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password}),
      });
      if (!res.ok) {
        setError(res.status === 401 ? 'Invalid credentials' : `Login failed (${res.status})`);
        return null;
      }

      const data: {
        token: string;
        user: {
          id: string;
          role: Role | string;
          validated?: boolean;
          username?: string;
          email?: string;
          learner?: LearnerMini | null;
        };
      } = await res.json();

      const u: User = {
        id: data.user.id,
        role: (data.user.role as Role),
        validated: !!data.user.validated,
        username: data.user.username,
        email: data.user.email,
        learner: data.user.learner ?? null,
      };

      setToken(data.token);
      setUser(u);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(u));
      return u;
    } catch (e: any) {
      setError(e?.message ?? 'Login error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAdmin = useMemo(() => user?.role === 'ADMIN', [user]);

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: !!token,
    isAdmin,
    isLoading,
    login,
    logout,
    error,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
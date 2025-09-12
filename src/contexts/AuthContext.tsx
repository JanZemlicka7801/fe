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
  logout: (callback?: () => void) => void;
  updateUser: (updatedUser: User) => void;
  forgotPassword: (email: string) => Promise<boolean>;
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
        // Handle different error status codes with more user-friendly messages
        switch (res.status) {
          case 401:
            setError('Nesprávné přihlašovací údaje. Zkontrolujte prosím email a heslo.');
            break;
          case 403:
            setError('Váš účet byl zablokován. Kontaktujte prosím správce systému.');
            break;
          case 404:
            setError('Uživatel s tímto emailem nebyl nalezen.');
            break;
          case 429:
            setError('Příliš mnoho pokusů o přihlášení. Zkuste to prosím později.');
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            setError('Chyba serveru. Zkuste to prosím později nebo kontaktujte podporu.');
            break;
          default:
            setError(`Přihlášení selhalo (${res.status}). Zkuste to prosím znovu.`);
        }
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
      // Handle network errors and other exceptions with user-friendly messages
      if (e.name === 'TypeError' && e.message.includes('Failed to fetch')) {
        setError('Nelze se připojit k serveru. Zkontrolujte prosím své internetové připojení.');
      } else if (e.name === 'AbortError') {
        setError('Požadavek byl přerušen. Zkuste to prosím znovu.');
      } else if (e.name === 'TimeoutError' || (e.message && e.message.includes('timeout'))) {
        setError('Připojení k serveru vypršelo. Zkuste to prosím později.');
      } else {
        setError(e?.message ? `Chyba přihlášení: ${e.message}` : 'Neznámá chyba přihlášení. Zkuste to prosím znovu.');
      }
      console.error('Login error:', e);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (callback?: () => void) => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Execute callback if provided (e.g., for navigation)
    if (callback) {
      callback();
    }
  };

  const isAdmin = useMemo(() => user?.role === 'ADMIN', [user]);

  const forgotPassword = async (email: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email }),
      });
      
      if (!res.ok) {
        // Handle different error status codes with user-friendly messages
        switch (res.status) {
          case 404:
            setError('Uživatel s tímto emailem nebyl nalezen.');
            break;
          case 429:
            setError('Příliš mnoho pokusů. Zkuste to prosím později.');
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            setError('Chyba serveru. Zkuste to prosím později nebo kontaktujte podporu.');
            break;
          default:
            setError(`Požadavek selhal (${res.status}). Zkuste to prosím znovu.`);
        }
        return false;
      }
      
      return true;
    } catch (e: any) {
      // Handle network errors and other exceptions with user-friendly messages
      if (e.name === 'TypeError' && e.message.includes('Failed to fetch')) {
        setError('Nelze se připojit k serveru. Zkontrolujte prosím své internetové připojení.');
      } else if (e.name === 'AbortError') {
        setError('Požadavek byl přerušen. Zkuste to prosím znovu.');
      } else if (e.name === 'TimeoutError' || (e.message && e.message.includes('timeout'))) {
        setError('Připojení k serveru vypršelo. Zkuste to prosím později.');
      } else {
        setError(e?.message ? `Chyba: ${e.message}` : 'Neznámá chyba. Zkuste to prosím znovu.');
      }
      console.error('Forgot password error:', e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

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
    forgotPassword,
    updateUser: (updatedUser: User) => {
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
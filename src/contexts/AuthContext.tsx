import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';

interface Learner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  lessons: number;
}

interface User {
  id: string;
  validated: boolean;
  role: 'USER' | 'ADMIN';
  learner: Learner;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,
  login: async () => null,
  logout: () => {},
  error: null,
  setError: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

const API_URL = 'http://localhost:8080/api';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    console.log('AuthContext: Initializing, checking localStorage...');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
        console.log('AuthContext: User data loaded from localStorage.');
      } catch (e) {
        console.error('AuthContext: Error parsing stored user JSON:', e);
        localStorage.removeItem('user'); // Clear corrupted data
        localStorage.removeItem('token'); // Clear token as well
      }
    } else {
      console.log('AuthContext: No user data or token found in localStorage.');
    }

    setIsLoading(false);
    console.log('AuthContext: Initialization complete. isLoading set to false.');
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    setIsLoading(true);
    setError(null);
    console.log('Login: Attempting to log in with email:', email);

    try {
      console.log(`Login: Sending POST request to ${API_URL}/auth/login`);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('Login: Received response. Status:', response.status, 'StatusText:', response.statusText);
      console.log('Login: Response OK status:', response.ok);
      console.log('Login: Response headers:', Array.from(response.headers.entries()));


      if (!response.ok) {
        let errorMessage = 'Login failed. Please check your credentials.'; // Default error message
        const errorResponse = response.clone();
        const contentType = errorResponse.headers.get('content-type');

        console.log('Login (Error Path): Response Content-Type:', contentType);

        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await errorResponse.json();
            console.log('Login (Error Path): Parsed JSON error data:', errorData);
            errorMessage = errorData.message || `Login failed with status ${response.status}.`;
          } catch (jsonError) {
            console.error("Login (Error Path): Error parsing JSON error response. Response text follows:", jsonError);
            const rawText = await errorResponse.text();
            console.error("Login (Error Path): Raw error response text:", rawText);
            errorMessage = 'Login failed: Could not parse server error JSON.';
          }
        } else {
          const textResponse = await errorResponse.text();
          console.warn('Login (Error Path): Server responded with non-JSON content. Raw text:', textResponse);
          errorMessage = `Login failed: Server error (${response.status} ${response.statusText}). Details: ${textResponse.substring(0, 100)}...`; // Truncate for log
          if (!textResponse.trim()) {
            errorMessage = `Login failed: Server responded with empty body (${response.status} ${response.statusText}).`;
          }
        }
        console.log('Login (Error Path): Throwing error with message:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('Login (Success Path): Response was OK. Attempting to parse JSON data...');
      const data = await response.json();
      console.log('Login (Success Path): Parsed successful login data:', data);

      if (!data.user || !data.token) {
        console.error('Login (Success Path): Missing user or token in successful response data.', data);
        throw new Error('Login response incomplete.');
      }

      const user: User = {
        id: data.user.id,
        validated: data.user.validated,
        role: data.user.role,
        learner: {
          id: data.user.learner.id,
          firstName: data.user.learner.firstName,
          lastName: data.user.learner.lastName,
          email: data.user.learner.email,
          phoneNumber: data.user.learner.phoneNumber,
          lessons: data.user.learner.lessons,
        },
      };

      console.log('Login (Success Path): User object constructed:', user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('Login (Success Path): Token and user stored in localStorage.');


      setToken(data.token);
      setUser(user);

      console.log('Login (Success Path): Login successful, returning user.');
      return user;
    } catch (err) {
      const finalErrorMessage = err instanceof Error ? err.message : 'An unknown error occurred during login process.';
      setError(finalErrorMessage);
      console.error('Login: Final catch block - Login error:', finalErrorMessage, err);
      return null;
    } finally {
      setIsLoading(false);
      console.log('Login: setIsLoading(false) executed.');
    }
  };

  const logout = () => {
    console.log('Logout: Initiating logout...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setError(null); // Clear any previous errors on logout
    console.log('Logout: User logged out, localStorage cleared.');
  };

  const value = {
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

export default AuthContext;
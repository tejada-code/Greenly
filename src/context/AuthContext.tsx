import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import api, { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../services/api';

export type AuthUser = {
  userId: number;
  email: string;
  nombre: string;
};

type Credentials = {
  email: string;
  password: string;
};

type Registration = Credentials & {
  nombre: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (credentials: Credentials) => Promise<void>;
  register: (registration: Registration) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser) as AuthUser);
        }
      } catch {
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, []);

  const saveSession = async (token: string, authenticatedUser: AuthUser) => {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
  };

  const login = async (credentials: Credentials) => {
    const response = await api.post<{ token: string; userId: number; email: string; nombre: string }>(
      '/auth/login',
      credentials,
    );
    await saveSession(response.data.token, {
      userId: response.data.userId,
      email: response.data.email,
      nombre: response.data.nombre,
    });
  };

  const register = async (registration: Registration) => {
    const response = await api.post<{ token: string; userId: number; email: string; nombre: string }>(
      '/auth/registro',
      registration,
    );
    await saveSession(response.data.token, {
      userId: response.data.userId,
      email: response.data.email,
      nombre: response.data.nombre,
    });
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  }
  return context;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error ?? fallback;
  }
  return fallback;
}
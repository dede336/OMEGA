import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export const AUTH_TOKEN_KEY = 'omega_dx10_auth_token';

export interface AuthUser {
  id: number;
  username: string;
  email?: string | null;
  isAdmin: boolean;
  role: string;
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthLoaded: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  getApiUrl: () => string;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isAuthLoaded: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  getApiUrl: () => '/api',
});


export function useAuth() {
  return useContext(AuthContext);
}

function buildApiUrl(): string {
  const env = process.env['EXPO_PUBLIC_API_URL'];
  if (env) return env;
  const domain = process.env['EXPO_PUBLIC_DOMAIN'];
  if (domain) return `https://${domain}/api`;
  if (__DEV__) {
    const hostUri = (Constants.expoConfig?.hostUri ?? '') as string;
    const host = hostUri.split(':')[0] ?? '';
    if (host) return `https://${host}/api`;
  }
  return '/api';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const apiUrl = useRef(buildApiUrl());

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (stored) {
          const me = await apiFetch('/auth/me', stored);
          if (me.ok) {
            const data = await me.json();
            setToken(stored);
            setUser({
              id: data.id,
              username: data.username,
              email: data.email ?? null,
              isAdmin: data.isAdmin ?? false,
              role: data.role ?? 'user',
              createdAt: data.createdAt,
            });
          } else {
            await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
          }
        }
      } catch {}
      setIsAuthLoaded(true);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function apiFetch(path: string, tok?: string, body?: object) {
    return fetch(`${apiUrl.current}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async function login(usernameOrEmail: string, password: string) {
    const res = await apiFetch('/auth/login', undefined, { username: usernameOrEmail, password });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Erro ao entrar');
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
    setToken(data.token);
    setUser({
      id: data.user.id,
      username: data.user.username,
      email: data.user.email ?? null,
      isAdmin: data.user.isAdmin ?? false,
      role: data.user.role ?? 'user',
      createdAt: data.user.createdAt,
    });
  }

  async function register(username: string, password: string, email?: string) {
    const res = await apiFetch('/auth/register', undefined, { username, password, email: email || undefined });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Erro ao criar conta');
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
    setToken(data.token);
    setUser({
      id: data.user.id,
      username: data.user.username,
      email: data.user.email ?? null,
      isAdmin: data.user.isAdmin ?? false,
      role: data.user.role ?? 'user',
      createdAt: data.user.createdAt,
    });
  }

  async function logout() {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthLoaded, login, register, logout, getApiUrl: () => apiUrl.current }}>
      {children}
    </AuthContext.Provider>
  );
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getApiUrl } from '~/utils/config';
import { Platform } from 'react-native';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load token and user from secure storage on mount
    const loadAuthData = async () => {
      try {
        let storedToken: string | null = null;
        let storedUser: string | null = null;
        if (Platform.OS === 'web') {
          storedToken = localStorage.getItem('auth_token');
          storedUser = localStorage.getItem('user_data');
        } else {
          storedToken = await SecureStore.getItemAsync('auth_token');
          storedUser = await SecureStore.getItemAsync('user_data');
        }
        console.log('Loaded token from storage:', storedToken ? 'Present' : 'Not found');
        if (storedToken) {
          setToken(storedToken);
        }
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
      }
    };
    loadAuthData();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${getApiUrl()}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      console.log('Login response:', data);
      // Handle different API response structures
      const userData = {
        id: data.id || data.user?.id || data._id,
        name: data.name || data.user?.name || email.split('@')[0],
        email: data.email || data.user?.email || email,
      };
      const newToken = data.token || data.accessToken;
      console.log('New token received:', newToken ? 'Present' : 'Not found');
      if (!newToken) {
        throw new Error('No token received from server');
      }
      if (Platform.OS === 'web') {
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('user_data', JSON.stringify(userData));
      } else {
        await Promise.all([
          SecureStore.setItemAsync('auth_token', newToken),
          SecureStore.setItemAsync('user_data', JSON.stringify(userData))
        ]);
      }
      setToken(newToken);
      setUser(userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      } else {
        await Promise.all([
          SecureStore.deleteItemAsync('auth_token'),
          SecureStore.deleteItemAsync('user_data')
        ]);
      }
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
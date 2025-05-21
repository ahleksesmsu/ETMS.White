import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'HR' | 'EMPLOYEE';
}

interface JwtPayload {
  user_id: string;
  exp: number;
  email: string;
  role: 'ADMIN' | 'HR' | 'EMPLOYEE';
  name: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp < currentTime) {
            await refreshToken();
          } else {
            setUser({
              id: decoded.user_id,
              email: decoded.email,
              name: decoded.name,
              role: decoded.role,
            });
          }
        } catch (error) {
          console.error('Token validation error:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/users/token/', { email, password });
      const { access, refresh } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      const decoded = jwtDecode<JwtPayload>(access);
      setUser({
        id: decoded.user_id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      });
      
      // Configure API with token
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post('/users/token/refresh/', { refresh });
      const { access } = response.data;
      
      localStorage.setItem('access_token', access);
      
      const decoded = jwtDecode<JwtPayload>(access);
      setUser({
        id: decoded.user_id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      });
      
      // Update API header
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
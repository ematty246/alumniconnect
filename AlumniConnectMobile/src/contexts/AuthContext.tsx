import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface User {
  email: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (userData: any) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Set up axios interceptor
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check token validity on app load
  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedRole = await AsyncStorage.getItem('userRole');
        
        if (storedToken) {
          setToken(storedToken);
          
          const response = await axios.get('http://localhost:8081/auth/check-token', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          
          if (response.data.valid) {
            setUser({
              email: response.data.email,
              username: response.data.username,
              role: storedRole || 'USER'
            });
          } else {
            await logout();
          }
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        await logout();
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:8081/auth/login', {
        email,
        password
      });

      const { token: newToken, role } = response.data;
      
      setToken(newToken);
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('userRole', role);
      
      // Get user details
      const userResponse = await axios.get('http://localhost:8081/auth/check-token', {
        headers: { Authorization: `Bearer ${newToken}` }
      });
      
      setUser({
        email: userResponse.data.email,
        username: userResponse.data.username,
        role
      });

      return { success: true, message: response.data.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await axios.post('http://localhost:8081/auth/register', userData);
      
      const { token: newToken, role } = response.data;
      
      setToken(newToken);
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('userRole', role);
      
      setUser({
        email: userData.email,
        username: userData.username,
        role
      });

      return { success: true, message: response.data.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userRole');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
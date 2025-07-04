import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

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
      if (token) {
        try {
          const response = await axios.get('http://localhost:8081/auth/check-token');
          if (response.data.valid) {
            setUser({
              email: response.data.email,
              username: response.data.username,
              role: localStorage.getItem('userRole')
            });
          } else {
            logout();
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkToken();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:8081/auth/login', {
        email,
        password
      });

      const { token: newToken, role } = response.data;
      
      setToken(newToken);
      localStorage.setItem('token', newToken);
      localStorage.setItem('userRole', role);
      
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
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('http://localhost:8081/auth/register', userData);
      
      const { token: newToken, role } = response.data;
      
      setToken(newToken);
      localStorage.setItem('token', newToken);
      localStorage.setItem('userRole', role);
      
      setUser({
        email: userData.email,
        username: userData.username,
        role
      });

      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
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
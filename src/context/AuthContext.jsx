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

useEffect(() => {
  // Set axios header BEFORE checkToken
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

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
          console.warn('Token invalid, clearing user');
          setUser(null); // 👈 Just clear user, don't logout
        }
      } catch (error) {
        console.error('Token validation failed:', error.message);
        setUser(null); // 👈 Don't force logout
      }
    }
    setLoading(false);
  };

  checkToken();
}, [token]);
const login = async ({ email, password, role, enrollNumber, department }) => {
  try {
    const payload = { email, password, role };

    if (role === 'STUDENT' && enrollNumber) {
      payload.enrollNumber = enrollNumber;
    }

    if (role === 'FACULTY' && department) {
      payload.department = department;
    }

    console.log('Sending login request with payload:', payload);

    const response = await axios.post('http://localhost:8081/auth/login', payload);
    console.log('Login response received:', response.data);

    const { token: newToken, role: returnedRole, user: userData = {} } = response.data;

    // Set token
    setToken(newToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('userRole', returnedRole);

    // Set axios header immediately
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

    // Build user object
    const userObj = {
      email: userData.email || email,
      username: userData.username || email.split('@')[0],
      role: returnedRole,
      department: userData.department || department || '' // Added department
    };

    setUser(userObj);

    // Background refresh of user info
    setTimeout(async () => {
      try {
        const userResponse = await axios.get('http://localhost:8081/auth/check-token');
        if (userResponse.data.valid) {
          setUser(prevUser => ({
            ...prevUser,
            email: userResponse.data.email,
            username: userResponse.data.username,
            role: returnedRole
          }));
        }
      } catch (error) {
        console.error('Background user data fetch failed:', error);
      }
    }, 0);

    return { success: true, message: response.data.message };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Login failed'
    };
  }
};


  // ✅ Updated register method to handle student pending verification
  const register = async (userData) => {
    try {
      console.log('Sending register request with data:', userData);

      const response = await axios.post('http://localhost:8081/auth/register', userData);
      console.log('Register response received:', response.data);

      const { token: newToken, role, user: responseUser, message } = response.data;

      // Check if this is a student registration (no token returned - pending verification)
      if (userData.role === 'STUDENT' && !newToken) {
        console.log('Student registration - pending verification, no token received');
        // Don't set token or user for students pending verification
        return { 
          success: true, 
          message: message || 'We are validating your credentials. You will be notified upon verification.',
          token: null,
          role: null
        };
      }

      // For ALUMNI/FACULTY with token
      if (newToken && role) {
        // Set token first
        setToken(newToken);
        localStorage.setItem('token', newToken);
        localStorage.setItem('userRole', role);

        // Set axios header immediately
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        // Set user state immediately
        const userObj = {
          email: responseUser?.email || userData.email,
          username: responseUser?.username || userData.username,
          role
        };

        console.log('Setting user state after registration:', userObj);
        setUser(userObj);

        return { 
          success: true, 
          message: message || 'Registration successful',
          token: newToken,
          role
        };
      }

      // Fallback case
      return { 
        success: true, 
        message: message || 'Registration successful',
        token: newToken,
        role
      };

    } catch (error) {
      console.error('Registration error:', error);
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
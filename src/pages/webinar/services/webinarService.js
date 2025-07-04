import axios from 'axios';

const API_BASE_URL = 'http://localhost:8086';

const webinarAPI = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include auth token
webinarAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to log responses for debugging
webinarAPI.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const webinarService = {
  // Create a new webinar
  createWebinar: async (webinarData) => {
    try {
      const response = await webinarAPI.post('/webinar/post', webinarData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create webinar');
    }
  },

  // Search webinars by keyword
  searchWebinars: async (keyword) => {
    try {
      const response = await webinarAPI.get(`/webinar/search?keyword=${encodeURIComponent(keyword)}`);
      console.log('Search API response:', response.data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to search webinars');
    }
  },

  // Get all webinars (using search with empty keyword)
  getAllWebinars: async () => {
    try {
      const response = await webinarAPI.get('/webinar/search?keyword=');
      console.log('Get all webinars API response:', response.data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch webinars');
    }
  }
};
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8082/onboarding';

export const profileService = {
  async getStudentProfile(username) {
    const response = await axios.get(`${API_BASE_URL}/student/public?username=${username}`);
    return response.data;
  },

  async getAlumniProfile(username) {
    const response = await axios.get(`${API_BASE_URL}/alumni/public?username=${username}`);
    return response.data;
  },

  async getFacultyProfile(username) {
    const response = await axios.get(`${API_BASE_URL}/faculty/public?username=${username}`);
    return response.data;
  }
};
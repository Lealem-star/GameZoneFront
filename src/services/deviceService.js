import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Create axios instance with base configuration
const deviceApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add auth token to requests
deviceApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Get all devices for the current user
export const getUserDevices = async () => {
  try {
    const response = await deviceApi.get('/auth/devices');
    return response.data;
  } catch (error) {
    console.error('Error fetching user devices:', error);
    throw error;
  }
};

// Remove a device from the user's account
export const removeDevice = async (deviceId) => {
  try {
    const response = await deviceApi.post('/auth/devices/remove', { deviceId });
    return response.data;
  } catch (error) {
    console.error('Error removing device:', error);
    throw error;
  }
};

const deviceService = {
  getUserDevices,
  removeDevice,
};

export default deviceService;
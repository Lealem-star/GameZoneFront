import axios from 'axios';

const API_BASE_URL = 'http://gursha-backend.vercel.app/api';

// Create axios instance with base configuration
const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor for debugging
authApi.interceptors.request.use(
  (config) => {
    console.log('🚀 Making request to:', config.url, config.data);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
authApi.interceptors.response.use(
  (response) => {
    console.log('✅ Response received:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// Test server connection
export const testServer = async () => {
  try {
    const response = await authApi.get('/auth/test');
    return response.data;
  } catch (error) {
    throw new Error(`Server connection failed: ${error.message}`);
  }
};

// Login function
export const login = async (credentials) => {
  try {
    console.log('🔐 Attempting login with:', credentials.username);

    const response = await authApi.post('/auth/signin', credentials);

    console.log('🎉 Login successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('💥 Login failed:', error);

    if (error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to server. Please make sure the server is running.');
    }

    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid credentials');
    }

    if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    }

    throw new Error('Login failed. Please check your connection and try again.');
  }
};

// Signup function
export const signup = async (userData) => {
  try {
    console.log('📝 Attempting signup for:', userData.username);

    const response = await authApi.post('/auth/signup', userData);

    console.log('✅ Signup successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('💥 Signup failed:', error);

    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Signup failed');
    }

    throw new Error('Signup failed. Please try again.');
  }
};

const logout = () => {
  // Remove token from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const authService = {
  login,
  signup,
  testServer,
  logout,
};

export default authService;

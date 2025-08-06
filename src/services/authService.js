import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Create axios instance with base configuration
const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increase the timeout to 30 seconds
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
    console.log('Testing server connection...');
    const response = await authApi.get('/auth/test');
    console.log('Server test response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Server connection test failed:', error);
    throw new Error(`Server connection failed: ${error.message}`);
  }
};

// Login function
export const login = async (credentials) => {
  try {
    console.log('🔐 Attempting login with:', credentials.username);
    console.log('📱 Using device info from request:', credentials.deviceInfo);
    
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

    if (error.response?.status === 403) {
      // Check if the error is related to maximum devices reached
      if (error.response.data.maxDevicesReached) {
        throw new Error('You have reached the maximum number of devices for this account. Please log out from another device before logging in with a new one.');
      }
      // Handle package depleted error
      throw new Error(error.response.data.message || 'Package depleted. Please contact admin to refill your package.');
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

// Logout function
export const logout = () => {
  console.log('🚪 Logging out user');
  
  // Clear all authentication data from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('role');
  localStorage.removeItem('username');
  localStorage.removeItem('user');
  
  // Don't remove deviceId on logout to maintain device tracking
  // If you want to completely remove the device, use the device manager
  
  console.log('✅ Logout successful');
  return { success: true };
};

const authService = {
  login,
  signup,
  testServer,
  logout,
};

export default authService;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, testServer } from '../services/authService';
import logo from '../assets/gurshalogo.png';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState('checking');
  const navigate = useNavigate();

  // Test server connection on component mount
  useEffect(() => {
    testServerConnection();
  }, []);

  const testServerConnection = async () => {
    try {
      setServerStatus('checking');
      await testServer();
      setServerStatus('connected');
      setError('');
    } catch (error) {
      setServerStatus('disconnected');
      setError('Server is not running. Please start the backend server.');
      console.error('Server connection test failed:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔄 Starting login process...');

      const response = await login(formData);
      console.log('✅ Login response:', response);

      // Save token and user info in local storage
      localStorage.setItem('token', response.token);
      localStorage.setItem('userId', response.userId);
      localStorage.setItem('role', response.role);
      localStorage.setItem('username', response.username);

      console.log('💾 User data saved to localStorage');
      console.log('🎯 Redirecting to dashboard...');

      // Redirect based on user role
      if (response.role === 'admin') {
        navigate('/AdminDashboard');
      } else if (response.role === 'gameController') {
        navigate('/GameController');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="flex flex-col items-center mb-6">
        <img src={logo} alt="Gursha Logo" className="h-24 mb-2" />
        <h1 className="text-2xl font-bold text-gray-700">Login</h1>

      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <div className="font-medium">Login Error:</div>
            <div>{error}</div>
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={serverStatus === 'disconnected'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter your username"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={serverStatus === 'disconnected'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading || serverStatus === 'disconnected'}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>



      </form>
    </div>
  );
};

export default LoginForm;

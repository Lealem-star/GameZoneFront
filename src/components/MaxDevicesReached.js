import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/gurshalogo.png';
import { logout } from '../services/authService';

const MaxDevicesReached = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Use the logout function from authService
    logout();
    
    // Redirect to login page
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Gursha Logo" className="h-24 mb-4" />
          <h1 className="text-2xl font-bold text-orange-600 mb-2">Device Limit Reached</h1>
          <div className="w-16 h-1 bg-orange-500 mb-4"></div>
        </div>
        
        <div className="text-center mb-8">
          <p className="text-gray-700 mb-4">
            You have reached the maximum number of devices (2) allowed for this account.
          </p>
          <p className="text-gray-700 mb-4">
            To log in on this device, please log out from one of your other devices first or use the device management page to remove a device.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  You can manage your devices by logging in on an already registered device and visiting the device management page.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-4">
          <button
            onClick={handleLogout}
            className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition duration-200"
          >
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaxDevicesReached;
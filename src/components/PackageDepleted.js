import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/gurshalogo.png';
import { useAuth } from '../context/AuthContext';

const PackageDepleted = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      // Use the async logout function from AuthContext
      await logout();
      
      // Redirect to login page
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
      // Redirect to login page even if there's an error
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Gursha Logo" className="h-24 mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">Package Depleted</h1>
          <div className="w-16 h-1 bg-red-500 mb-4"></div>
        </div>

        <div className="text-center mb-8">
          <p className="text-gray-700 mb-4">
            Your package has been depleted. You cannot access the system until you purchase a new package.
          </p>
          <p className="text-gray-700 mb-4">
            Please contact the administrator to refill your package and continue using the service.
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Contact information: <strong>0934551781</strong>
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
};

export default PackageDepleted;
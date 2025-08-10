import React, { createContext, useState,useContext } from 'react';
import authService from '../services/authService';
export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);

  const logout = async () => {
    try {
      // Call the async logout function from authService
      await authService.logout();
      setAuth(null);
      // Note: localStorage items are already cleared in the authService.logout() function
    } catch (error) {
      console.error('Error during logout:', error);
      // Ensure auth state is cleared even if there's an error
      setAuth(null);
    }
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth,logout }}>
      {children}
    </AuthContext.Provider>
  );
};

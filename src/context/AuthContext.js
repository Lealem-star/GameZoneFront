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

  const logout = () => {
    authService.logout();
    setAuth(null);
    // Clear all auth-related localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth,logout }}>
      {children}
    </AuthContext.Provider>
  );
};

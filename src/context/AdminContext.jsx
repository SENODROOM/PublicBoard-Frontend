import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    // Check if admin is logged in from localStorage
    const storedAdmin = localStorage.getItem('adminUser');
    if (storedAdmin) {
      setAdminUser(JSON.parse(storedAdmin));
      setIsAdmin(true);
    }
  }, []);

  const login = (username, password) => {
    // Simple admin authentication (in production, use proper backend auth)
    if (username === 'admin' && password === 'admin123') {
      const admin = { username: 'admin', role: 'administrator' };
      setAdminUser(admin);
      setIsAdmin(true);
      localStorage.setItem('adminUser', JSON.stringify(admin));
      return { success: true };
    }
    return { success: false, message: 'Invalid credentials' };
  };

  const logout = () => {
    setAdminUser(null);
    setIsAdmin(false);
    localStorage.removeItem('adminUser');
  };

  return (
    <AdminContext.Provider value={{ isAdmin, adminUser, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

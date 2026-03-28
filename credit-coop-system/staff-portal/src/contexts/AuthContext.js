import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock staff user data
  const mockStaffUser = {
    id: 'staff_001',
    firstName: 'Maria',
    lastName: 'Santos',
    email: 'maria.santos@creditcoop.ph',
    role: 'manager',
    department: 'Operations',
  permissions: ['members', 'reports'],
    avatar: 'MS'
  };

  useEffect(() => {
    // Check if user is logged in (mock implementation)
    const storedUser = localStorage.getItem('staffUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Mock login validation
      if (email === 'staff@creditcoop.ph' && password === 'staff123') {
        localStorage.setItem('staffUser', JSON.stringify(mockStaffUser));
        setUser(mockStaffUser);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('staffUser');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

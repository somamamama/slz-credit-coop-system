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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('memberPortalToken');
        if (token) {
          // Verify token with server
          const response = await fetch('http://localhost:5001/auth/is-verify', {
            headers: {
              'token': token
            }
          });
          if (response.ok) {
            // Token is valid, fetch user dashboard data from backend
            const dashboardRes = await fetch('http://localhost:5001/dashboard', {
              headers: {
                'token': token
              }
            });
            if (dashboardRes.ok) {
              const userData = await dashboardRes.json();
              setUser({ authenticated: true, ...userData });
            } else {
              setUser({ authenticated: true }); // fallback
            }
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('memberPortalToken');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('memberPortalToken');
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (memberNumber, password) => {
    try {
      const response = await fetch('http://localhost:5001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberNumber: memberNumber,
          password: password
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Login failed');
      }

      const data = await response.json();
      
      // Store the JWT token
      localStorage.setItem('memberPortalToken', data.token);
      
      // Set user as authenticated
      setUser({ authenticated: true, ...data.user });
      
      return data.user;
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('memberPortalToken');
  };

  // Allow updating the user in context (e.g., after profile edits)
  const updateUser = (updatedUser) => {
    setUser((prev) => ({ ...(prev || {}), ...(updatedUser || {}) }));
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

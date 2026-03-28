import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';
import { hasPermission } from '../utils/permissions';
import Unauthorized from './Unauthorized';

const ProtectedRoute = ({ children, requiredRoute }) => {
  const { userRole, loading } = useUserRole();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Checking permissions...</p>
      </div>
    );
  }

  // If no user role, redirect to login
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  // If user doesn't have permission for this route, show unauthorized
  if (requiredRoute && !hasPermission(userRole, requiredRoute)) {
    return <Unauthorized />;
  }

  return children;
};

export default ProtectedRoute;

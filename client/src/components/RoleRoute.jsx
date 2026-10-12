import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function RoleRoute({ children, allowedRoles = ['mentor', 'admin'] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text="Checking permissions..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

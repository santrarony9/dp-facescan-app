import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedScanRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();
  
  if (!token) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  
  return children;
};

export default ProtectedScanRoute;

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const location = useLocation();

  const roleDashboards = {
    user: '/user-dashboard',
    sponsor: '/sponsor-dashboard',
    panel: '/panel-dashboard',
    registrar: '/registrar-dashboard',
  };

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to correct dashboard based on user's role
    const redirectPath = roleDashboards[user.role] || '/';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default RoleProtectedRoute;
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Navigate } from 'react-router-dom';

import Header from './components/Header';
import RoleProtectedRoute from './components/RoleProtectedRoute';

import Login from './pages/Login';
import UserRegister from './pages/UserRegister';
import SponsorRegister from './pages/SponsorRegister';
import UserDashboard from './pages/UserDashboard';
import SponsorDashboard from './pages/SponsorDashboard';
import PanelDashboard from './pages/PanelDashboard';
import RegistrarDashboard from './pages/RegistrarDashboard';
import Unauthorized from './pages/Unauthorized';
import UserProfile from './pages/UserProfile';

function AppLayout() {
  const location = useLocation();
  const hideHeaderOnPaths = ['/login', '/user/register', '/sponsor/register'];
  const hideHeader = hideHeaderOnPaths.includes(location.pathname);

  return (
    <div className="container">
      {!hideHeader && <Header />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/user/register" element={<UserRegister />} />
        <Route path="/sponsor/register" element={<SponsorRegister />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes */}
        <Route
          path="/user-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['user']}>
              <UserDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/sponsor-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['sponsor']}>
              <SponsorDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/panel-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['panel']}>
              <PanelDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/registrar-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['registrar']}>
              <RegistrarDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <RoleProtectedRoute allowedRoles={['user', 'sponsor', 'panel', 'registrar']}>
              <UserProfile />
            </RoleProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <>
      <Router>
        <AppLayout />
      </Router>
      <ToastContainer />
    </>
  );
}

export default App;
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UserRegister from './pages/UserRegister';
import SponsorRegister from './pages/SponsorRegister';

function AppLayout() {
  const location = useLocation();
  const hideHeaderOnPaths = ['/login', '/user/register', '/sponsor/register'];
  const hideHeader = hideHeaderOnPaths.includes(location.pathname);

  return (
    <div className="container">
      {!hideHeader && <Header />}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/user/register" element={<UserRegister />} />
        <Route path="/sponsor/register" element={<SponsorRegister />} />
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
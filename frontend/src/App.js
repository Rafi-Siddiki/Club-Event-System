import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Header from './components/Header';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UserRegister from './pages/UserRegister';
import SponsorRegister from './pages/SponsorRegister';

function App() {
  return (
    <>
    <Router>
    <div className='container'>
      <Header />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/user/register" element={<UserRegister />} />
        <Route path="/sponsor/register" element={<SponsorRegister />} />
      </Routes>
    </div>
    </Router>
    </>
  );
}

export default App;

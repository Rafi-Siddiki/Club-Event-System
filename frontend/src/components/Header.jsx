import React from 'react';
import { FaSignInAlt, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import '../stylesheets/Header.css'; // Import the new stylesheet

function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">Club Event System</Link>
        </div>
        <nav>
          <ul className="nav-links">
            {user ? (
              <li>
                <button className="btn logout-btn" onClick={onLogout}>
                  <FaSignOutAlt /> Logout
                </button>
              </li>
            ) : (
              <>
                <li>
                  <Link to="/login" className="nav-link">
                    <FaSignInAlt /> Login
                  </Link>
                </li>
                <li>
                  <Link to="/user/register" className="nav-link">
                    <FaUser /> Register
                  </Link>
                </li>
                <li>
                  <Link to="/sponsor/register" className="nav-link">
                    <FaUser /> Sponsor Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
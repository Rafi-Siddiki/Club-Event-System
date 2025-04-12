import React, { useState, useEffect } from 'react';
import '../stylesheets/Login.css';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, reset } from '../features/auth/authSlice';
import Spinner from '../components/Spinner';
import { toast } from 'react-toastify';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { email, password } = formData;

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, isLoading, isError, isSuccess, message, type } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (user) {
      // Redirect logged-in users to their respective dashboard
      switch (user.role) {
        case 'user':
          navigate('/user-dashboard');
          break;
        case 'sponsor':
          navigate('/sponsor-dashboard');
          break;
        case 'panel':
          navigate('/panel-dashboard');
          break;
        case 'registrar':
          navigate('/registrar-dashboard');
          break;
        default:
          navigate('/');
      }
    }

    if (isError) {
      toast.error(message);
    }

    // Only show the registration success message if the type is 'register'
    if (isSuccess && type === 'register') {
      toast.success("Registration successful! You can log in after approval.");
      navigate('/login');
    }

    dispatch(reset());
  }, [user, isError, isSuccess, message, type, navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    const userData = {
      email,
      password,
    };

    dispatch(login(userData)); // Log the user in if approved
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="user-register-bg">
      <div className="glass-card-wrapper">
        <div className="glass-card">
          <div className="user-register-form">
            <h2>Event Flow</h2>
            <h4>Enter Your Information to Sign In</h4>
            <form onSubmit={onSubmit}>
              <input
                type="email"
                placeholder="Email"
                id="email"
                name="email"
                value={email}
                onChange={onChange}
                required
              />
              <input
                type="password"
                placeholder="Password"
                id="password"
                name="password"
                value={password}
                onChange={onChange}
                required
              />
              <button type="submit">Sign In</button>
            </form>
          </div>
          <h3>Don't have an account?</h3>
          <a href="/user/register">
            <button type="button">Sign Up</button>
          </a>
          <h3>Become a Sponsor?</h3>
          <a href="/sponsor/register">
            <button type="button">Apply Now</button>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;
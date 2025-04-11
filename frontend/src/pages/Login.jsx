import React from 'react';
import '../stylesheets/Login.css';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch} from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { login, reset } from '../features/auth/authSlice';
import Spinner from '../components/Spinner';

function Login() {
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    club: '',
  });

  const { email, password} = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const {user, isLoading, isError, isSuccess, message} = useSelector((state) => state.auth)

    useEffect(() => {
      if (isError) {
        toast.error(message);
      }
  
      if (isSuccess || user) {
        navigate('/');
      }
  
      dispatch(reset());
  
    }, [user, isError, isSuccess, message, navigate, dispatch]);
  
  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  }

  const onSubmit = (e) => {
    e.preventDefault();

    const userData = {
      email,
      password,
    }
    dispatch(login(userData))
  }

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="user-register-bg">
      <div className="glass-card-wrapper">
        <div className="glass-card">
          <div className="user-register-form">
            <h2>Event Flow</h2>
            <h4> Enter Your Information to Sign In</h4>
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

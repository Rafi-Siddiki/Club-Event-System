import React from 'react';
import '../stylesheets/UserRegister.css';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { registerSponsor, reset } from '../features/auth/authSlice';
import Spinner from '../components/Spinner';

function SponsorRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    cevent: '', // Changed from 'event' to 'cevent' to match backend model
    company: '',
  });

  const { name, email, password, phone, cevent, company } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message, type } = useSelector((state) => state.auth);

  useEffect(() => {
    document.title = 'Sponsor Registration';

    // Add check for existing user
    if (user) {
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

    if (isSuccess) {
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
      name,
      email,
      password,
      phone,
      cevent, // Changed from 'event' to 'cevent'
      company,
    };
    dispatch(registerSponsor(userData));
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="user-register-bg">
      <div className="glass-card-wrapper">
        <div className="glass-card">
          <div className="user-register-form">
            <h2>Sponsorship</h2>
            <h4> Enter Your Details to Apply</h4>
            <form onSubmit={onSubmit}>
              <input
                type="text"
                placeholder="Name"
                id="name"
                name="name"
                value={name}
                onChange={onChange}
                required
              />
              <input
                type="text"
                placeholder="Company"
                id="company"
                name="company"
                value={company}
                onChange={onChange}
                required
              />
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
                type="tel"
                placeholder="Phone"
                id="phone"
                name="phone"
                value={phone}
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
              <select id="cevent" name="cevent" value={cevent} onChange={onChange}>
                <option value="">Select Event</option>
                <option value="event1">Event 1</option>
                <option value="event2">Event 2</option>
                <option value="event3">Event 3</option>
              </select>
              <button type="submit">Apply</button>
            </form>
          </div>
          <h3>Already a Sponsor?</h3>
          <a href="/login">
            <button type="button">Sign In</button>
          </a>
        </div>
      </div>
    </div>
  );
}

export default SponsorRegister;

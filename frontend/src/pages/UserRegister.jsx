import React, { useState, useEffect } from 'react';
import '../stylesheets/UserRegister.css';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { register, reset } from '../features/auth/authSlice';
import Spinner from '../components/Spinner';

function UserRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    club: '',
  });

  const { name, email, password, phone, club } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isLoading, isError, isSuccess, message } = useSelector((state) => state.auth);

  useEffect(() => {
    document.title = 'User Registration';

    if (isError) {
      toast.error(message);
    }

    if (isSuccess) {
      toast.success("Registration successful! You can log in after approval.");
      navigate('/login');
    }

    dispatch(reset());
  }, [isError, isSuccess, message, navigate, dispatch]);

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
      club,
    };
    dispatch(register(userData));
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="user-register-bg">
      <div className="glass-card-wrapper">
        <div className="glass-card">
          <div className="user-register-form">
            <h2>User Registration</h2>
            <h4>Enter Your Details</h4>
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
              <select id="club" name="club" value={club} onChange={onChange} required>
                <option value="">Select a club</option>
                <option value="club1">Club 1</option>
                <option value="club2">Club 2</option>
                <option value="club3">Club 3</option>
              </select>
              <button type="submit">Submit</button>
            </form>
          </div>
          <h3>Already have an account?</h3>
          <a href="/login">
            <button type="button">Sign In</button>
          </a>
        </div>
      </div>
    </div>
  );
}

export default UserRegister;

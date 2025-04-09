import React from 'react';
import '../stylesheets/Login.css';

function Login() {
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    club: '',
  });

  const { email, password} = formData;
  
  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  }

  const onSubmit = (e) => {
    e.preventDefault();
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

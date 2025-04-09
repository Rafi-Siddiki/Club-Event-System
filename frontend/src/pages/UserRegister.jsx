import React from 'react';
import '../stylesheets/UserRegister.css';

function UserRegister() {
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    club: '',
  });

  const { username, email, password, phone, club } = formData;
  
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
            <h2>User Registration</h2>
            <h4> Enter Your Details</h4>
            <form onSubmit={onSubmit}>
              <input
                type="text"
                placeholder="Name"
                id="username"
                name="username"
                value={username}
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
              <select id="club" name="club">
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

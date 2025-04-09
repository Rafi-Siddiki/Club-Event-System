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
  return (
    <div className="user-register-bg">
      {/* Wrapper for the glass card */}
      <div className="glass-card-wrapper">
        {/* Glass effect applied here */}
        <div className="glass-card">
          <div className="user-register-form">
            <h2>User Registration</h2>
            <h4> Enter Your Details</h4>
            <form>
              <input
                type="text"
                placeholder="Name"
                id="username"
                name="username"
                required
              />
              <input
                type="email"
                placeholder="Email"
                id="email"
                name="email"
                required
              />
              <input
                type="tel"
                placeholder="Phone"
                id="phone"
                name="phone"
                required
              />
              <input
                type="password"
                placeholder="Password"
                id="password"
                name="password"
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
          <button type="submit">Sign In</button>
        </div>
      </div>
    </div>
  );
}

export default UserRegister;

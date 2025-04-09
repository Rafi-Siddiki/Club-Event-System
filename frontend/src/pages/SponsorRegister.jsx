import React from 'react';
import '../stylesheets/UserRegister.css';

function SponsorRegister() {
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    event: '',
    company: '',
  });

  const { username, email, password, phone, event, company } = formData;
  
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
            <h2>Sponsorship</h2>
            <h4> Enter Your Details to Apply</h4>
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
                type="text"
                placeholder="Comany"
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
              <select id="club" name="club">
                <option value="">Select Event </option>
                <option value="event1">Event 1</option>
                <option value="event2">Event 2</option>
                <option value="event2">Event 3</option>
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

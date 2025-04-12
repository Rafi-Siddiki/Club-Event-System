import React from 'react';
import '../stylesheets/ViewMyProfile.css';
import { Link } from 'react-router-dom';

function UserDashboard() {
  React.useEffect(() => {
    document.title = 'User Dashboard';
  }, []);

  return (
    <div>
      <h1>UserDashboard</h1>
      {/* Profile Button Section */}
      <div className="dashboard-actions">
        <Link to="/profile" className="profile-link">
          <button type="button">View My Profile</button>
        </Link>
      </div>
    </div>
  );
}

export default UserDashboard;
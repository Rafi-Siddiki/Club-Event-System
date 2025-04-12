import React from 'react'
import '../stylesheets/ViewMyProfile.css';
import { Link } from 'react-router-dom'
function RegistrarDashboard() {
  React.useEffect(() => {
    document.title = 'Registrar Dashboard';
  }, []);
  return (
    <div>
      <h1>RegistrarDashboard</h1>
      {/* ADD THIS SECTION */}
      <div className="dashboard-actions">
        <Link to="/profile" className="profile-link">
          <button type="button">View My Profile</button>
        </Link>
      </div>
      {/* END ADDED SECTION */}
    </div>
  )
}

export default RegistrarDashboard
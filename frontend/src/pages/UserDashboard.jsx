import React from 'react'

function UserDashboard() {
  React.useEffect(() => {
    document.title = 'User Dashboard';
  }, []);

  return (
    <div>UserDashboard</div>
  );
}

export default UserDashboard;

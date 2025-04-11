import React from 'react'

function SponsorDashboard() {
  React.useEffect(() => {
    document.title = 'Sponsor Dashboard';
  }, []);
  return (
    <div>SponsorDashboard</div>
  )
}

export default SponsorDashboard
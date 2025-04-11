import React from 'react'

function PanelDashboard() {
  React.useEffect(() => {
    document.title = 'Panel Dashboard';
  }, []);
  return (
    <div>PanelDashboard</div>
  )
}

export default PanelDashboard
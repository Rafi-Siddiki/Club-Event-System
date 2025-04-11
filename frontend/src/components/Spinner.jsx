import React from 'react'

function Spinner() {
  return (
    <div className='loadingSpinnerContainer'>
        <div className="loadingSpinner"></div>
        <div className="loadingSpinnerText">Loading...</div>
    </div>
  )
}

export default Spinner
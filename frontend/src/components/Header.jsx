import React from 'react'

import { FaSignInAlt, FaSignOutAlt, FaUser} from 'react-icons/fa'

import { Link } from 'react-router-dom'

function Header() {
  return (
    <header className='header'>
        <div className="logo">
            <Link to='/'>GoalStter</Link>
        </div>
        <ul>
            <li>
            <Link to='/login'>
                <FaSignInAlt /> Login
            </Link>
            </li>
            <li>
            <Link to='/user/register'>
                <FaUser /> Register
            </Link>
            </li>
            <li>
            <Link to='/sponsor/register'>
                <FaUser /> Sponsor Register
            </Link>
            </li>
        </ul>
    </header>
  )
}

export default Header
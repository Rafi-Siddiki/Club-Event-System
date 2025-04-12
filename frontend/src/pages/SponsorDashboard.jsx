import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../stylesheets/SponsorDashboard.css';
import '../stylesheets/ViewMyProfile.css';

function SponsorDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('fundingProposals');
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set page title
    document.title = 'Sponsor Dashboard';
  }, []);

  useEffect(() => {
    // Protect this route - only sponsors can access
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'sponsor') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Fetch opportunities when the component mounts or the active tab changes to funding proposals
    if (activeTab === 'fundingProposals') {
      fetchOpportunities();
    }
  }, [activeTab]);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/opportunities', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setOpportunities(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch funding opportunities');
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'fundingProposals':
        return (
          <div className="funding-proposals">
            <h2>Funding Opportunities</h2>
            {loading ? (
              <p>Loading opportunities...</p>
            ) : error ? (
              <p className="error">{error}</p>
            ) : opportunities.length > 0 ? (
              <div className="proposals-list">
                {opportunities.map((opportunity) => (
                  <div key={opportunity._id} className="proposal-card">
                    <h3>{opportunity.name}</h3>
                    <p>{opportunity.description}</p>
                    <div className="proposal-details">
                      <span>Starting Price: ${opportunity.startingPrice}</span>
                      <span>Date: {new Date(opportunity.date).toLocaleDateString()}</span>
                    </div>
                    <div className="proposal-details">
                      <span>Club: {opportunity.club}</span>
                      <span>Attendance: {opportunity.attendance}</span>
                    </div>
                    <div className="proposal-details">
                      <span>Status: {opportunity.status}</span>
                      <span>Location: {opportunity.location}</span>
                    </div>
                    <div className="proposal-actions">
                      <button className="btn-view">View Details</button>
                      <button className="btn-approve">Express Interest</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No funding opportunities available at the moment.</p>
            )}
          </div>
        );
      default:
        return <div>Select an option from the sidebar</div>;
    }
  };

  return (
    <div className="sponsor-dashboard">
      <div className="welcome-section">
        <h1>Welcome {user?.name}</h1>
        <p>Sponsor Dashboard</p>
      </div>

      {/* Profile Button Section */}
      <div className="dashboard-actions">
        <Link to="/profile" className="profile-link">
          <button type="button">View My Profile</button>
        </Link>
      </div>

      <div className="dashboard-container">
        <div className="sidebar">
          <ul>
            <li
              className={activeTab === 'fundingProposals' ? 'active' : ''}
              onClick={() => setActiveTab('fundingProposals')}
            >
              <i className="fas fa-money-check"></i> Funding Opportunities
            </li>
            {/* More menu items can be added here */}
          </ul>
        </div>
        <div className="main-content">{renderTabContent()}</div>
      </div>
    </div>
  );
}

export default SponsorDashboard;
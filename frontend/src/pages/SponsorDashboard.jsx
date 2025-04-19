import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../stylesheets/SponsorDashboard.css';
import '../stylesheets/ViewMyProfile.css';
import { toast } from 'react-toastify';

function SponsorDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('fundingProposals');
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [interestedPackages, setInterestedPackages] = useState([]);

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
      
      // Fetch the user's interested packages
      const interestResponse = await axios.get('/api/opportunities/interested-packages', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      
      if (interestResponse.data) {
        setInterestedPackages(interestResponse.data);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch funding opportunities');
      setLoading(false);
    }
  };

  const handleViewDetails = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOpportunity(null);
  };

  // Handle expressing interest in a proposal
  const handleExpressInterest = async (opportunityId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      await axios.post(`/api/opportunities/${opportunityId}/interest`, {}, config);
      toast.success('Interest expressed successfully. Your request will be reviewed by a registrar.');
      
      // Refresh the opportunities list
      fetchOpportunities();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to express interest';
      toast.error(errorMessage);
    }
  };

  // Handle expressing interest in a specific package
  const handleExpressInterestInPackage = async (opportunityId, packageIndex) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      await axios.post(`/api/opportunities/${opportunityId}/interest`, { 
        packageIndex 
      }, config);
      
      // Update local state to immediately reflect the interest
      setInterestedPackages([
        ...interestedPackages,
        { opportunityId, packageIndex }
      ]);
      
      toast.success('Interest expressed in this sponsorship package. Your request will be reviewed by a registrar.');
      
      // Refresh the opportunities list
      fetchOpportunities();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to express interest in package';
      toast.error(errorMessage);
    }
  };

  // Check if user has already expressed interest
  const hasExpressedInterest = (opportunity) => {
    return user && 
           user._id && 
           opportunity.interestedSponsors && 
           Array.isArray(opportunity.interestedSponsors) && 
           opportunity.interestedSponsors.includes(user._id);
  };

  // Check if user has expressed interest in a specific package
  const hasExpressedInterestInPackage = (opportunityId, packageIndex) => {
    return interestedPackages.some(
      item => item.opportunityId === opportunityId && item.packageIndex === packageIndex
    );
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
                      <button className="btn-view" onClick={() => handleViewDetails(opportunity)}>View Details</button>
                      {hasExpressedInterest(opportunity) ? (
                        <button className="btn-disabled" disabled>Interest Expressed</button>
                      ) : (
                        <button 
                          className="btn-approve" 
                          onClick={() => handleExpressInterest(opportunity._id)}
                        >
                          Express Interest
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-opportunities">
                <p>No approved funding opportunities available at the moment.</p>
                <p className="note">Funding proposals must be approved by a registrar before they appear here.</p>
              </div>
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

      {/* Event Details Modal */}
      {showModal && selectedOpportunity && (
        <div className="modal-overlay">
          <div className="event-details-modal">
            <div className="modal-header">
              <h2>{selectedOpportunity.name}</h2>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>
            <div className="modal-content">
              <div className="event-detail-item">
                <strong>Description:</strong>
                <p>{selectedOpportunity.description}</p>
              </div>
              <div className="event-detail-row">
                <div className="event-detail-item">
                  <strong>Club:</strong>
                  <p>{selectedOpportunity.club}</p>
                </div>
                <div className="event-detail-item">
                  <strong>Date:</strong>
                  <p>{new Date(selectedOpportunity.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="event-detail-row">
                <div className="event-detail-item">
                  <strong>Location:</strong>
                  <p>{selectedOpportunity.location}</p>
                </div>
                <div className="event-detail-item">
                  <strong>Expected Attendance:</strong>
                  <p>{selectedOpportunity.attendance}</p>
                </div>
              </div>
              <div className="event-detail-row">
                <div className="event-detail-item">
                  <strong>Starting Price:</strong>
                  <p>${selectedOpportunity.startingPrice}</p>
                </div>
                <div className="event-detail-item">
                  <strong>Status:</strong>
                  <p>{selectedOpportunity.status}</p>
                </div>
              </div>
              
              {/* Display available sponsorship packages */}
              {selectedOpportunity.packages && selectedOpportunity.packages.length > 0 ? (
                <>
                  <h3>Sponsorship Packages</h3>
                  <div className="packages-container">
                    {selectedOpportunity.packages.map((pkg, index) => (
                      <div key={index} className="package-item">
                        <h4>{pkg.name || `Package ${index + 1}`}</h4>
                        <div className="package-detail">
                          <strong>Price:</strong>
                          <p>${pkg.price}</p>
                        </div>
                        <div className="package-detail">
                          <strong>Benefits:</strong>
                          <ul>
                            {pkg.benefits && Array.isArray(pkg.benefits) ? 
                              pkg.benefits.map((benefit, i) => (
                                <li key={i}>{benefit}</li>
                              )) : 
                              <li>No benefits listed</li>
                            }
                          </ul>
                        </div>
                        <button 
                          className={hasExpressedInterestInPackage(selectedOpportunity._id, index) ? "btn-disabled" : "btn-approve"}
                          onClick={() => handleExpressInterestInPackage(selectedOpportunity._id, index)}
                          disabled={hasExpressedInterestInPackage(selectedOpportunity._id, index)}
                        >
                          {hasExpressedInterestInPackage(selectedOpportunity._id, index) ? 
                            "Interest Expressed" : 
                            "Express Interest"
                          }
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="no-packages">
                  <p>No sponsorship packages are available for this event.</p>
                </div>
              )}
              
              <div className="modal-actions">
                <button className="btn-view" onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SponsorDashboard;

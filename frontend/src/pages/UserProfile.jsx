import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';
import '../stylesheets/UserProfile.css';

function UserProfile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  // Make sure we're accessing the auth state correctly
  const { user } = useSelector((state) => state.auth);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check if user exists and has a token
        if (!user || !user.token) {
          console.log("No user or token found:", user);
          navigate('/login');
          return;
        }
        
        console.log("Attempting to fetch with token:", user.token);
        
        const config = {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        };
        
        // Make the API request
        const response = await axios.get('/api/users/me', config);
        console.log("API Response:", response.data);
        setUserData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error.response || error);
        const message = error.response?.data?.message || error.message || 'Failed to fetch user data';
        toast.error(message);
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate, user]);
  
  // Add debugging output
  console.log("Current user state:", user);
  console.log("Current userData state:", userData);
  
  if (loading) {
    return <div className="loading-spinner">Loading profile information...</div>;
  }
  
  // Direct fallback to user from Redux if API call failed
  const displayData = userData || user;
  
  if (!displayData) {
    return <div className="no-data">No profile data available</div>;
  }
  
  return (
    <div className="profile-page">
      <div className="profile-container">
        <h2 className="profile-title">Profile Information</h2>
        
        <div className="profile-content">
          <div className="profile-details">
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={displayData.name || ''} 
                readOnly
              />
            </div>
            
            <div className="form-group">
              <label>Personal Email</label>
              <input 
                type="email" 
                value={displayData.email || ''} 
                readOnly
              />
            </div>
            
            <div className="form-group">
              <label>Contact Number</label>
              <input 
                type="text" 
                value={displayData.phone || ''} 
                readOnly
              />
            </div>
            
            <div className="form-group">
              <label>Role</label>
              <input 
                type="text" 
                value={displayData.role || ''} 
                readOnly
              />
            </div>
            
            {displayData.club && (
              <div className="form-group">
                <label>Club</label>
                <input 
                  type="text" 
                  value={displayData.club} 
                  readOnly
                />
              </div>
            )}
            
            {displayData.company && (
              <div className="form-group">
                <label>Company</label>
                <input 
                  type="text" 
                  value={displayData.company} 
                  readOnly
                />
              </div>
            )}
            
            {displayData.cevent && (
              <div className="form-group">
                <label>Event</label>
                <input 
                  type="text" 
                  value={displayData.cevent} 
                  readOnly
                />
              </div>
            )}
            
            <div className="form-group">
              <label>Account Status</label>
              <input 
                type="text" 
                value={displayData.approved ? 'Approved' : 'Pending Approval'} 
                readOnly
                className={displayData.approved ? 'approved-status' : 'pending-status'}
              />
            </div>
          </div>
          
          <div className="profile-picture-container">
            <div className="profile-picture">
              <div className="profile-avatar">
                {displayData.name ? displayData.name.charAt(0).toUpperCase() : '👤'}
              </div>
            </div>
            <p>Profile Picture</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
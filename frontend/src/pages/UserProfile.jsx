import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';
import '../stylesheets/UserProfile.css';

function UserProfile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', phone: '' });

  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!user || !user.token) {
          navigate('/login');
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        const response = await axios.get('/api/users/me', config);
        setUserData(response.data);
        setEditFormData({
          name: response.data.name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
        });
        setLoading(false);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch user data');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, user]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const response = await axios.put(`/api/users/${user._id}`, editFormData, config);
      setUserData(response.data);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading profile information...</div>;
  }

  if (!userData) {
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
                name="name"
                value={isEditing ? editFormData.name : userData.name}
                onChange={handleInputChange}
                readOnly={!isEditing}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={isEditing ? editFormData.email : userData.email}
                onChange={handleInputChange}
                readOnly={!isEditing}
              />
            </div>
            <div className="form-group">
              <label>Phone No</label>
              <input
                type="text"
                name="phone"
                value={isEditing ? editFormData.phone : userData.phone}
                onChange={handleInputChange}
                readOnly={!isEditing}
              />
            </div>
            <div className="form-group">
              <label>Club</label>
              <input
                type="text"
                name="club"
                value={userData.club || 'N/A'}
                readOnly
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input
                type="text"
                name="role"
                value={userData.role || 'N/A'}
                readOnly
              />
            </div>
            <div className="form-group">
              <label>Approval Status</label>
              <input
                type="text"
                name="approved"
                value={userData.approved ? 'Approved' : 'Pending'}
                readOnly
              />
            </div>
            <div className="form-group">
              {isEditing ? (
                <button className="btn-save" onClick={handleSave}>
                  Save
                </button>
              ) : (
                <button className="btn-edit" onClick={handleEditToggle}>
                  Edit
                </button>
              )}
            </div>
          </div>
          <div className="profile-picture-container">
            <div className="profile-picture">
              <div className="profile-avatar">
                {userData.name ? userData.name.charAt(0).toUpperCase() : '👤'}
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
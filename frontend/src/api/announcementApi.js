import axios from 'axios';

export const postAnnouncement = async (data, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.post('/api/announcements', data, config);
  return response.data;
};

export const getAnnouncements = async (eventId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.get(`/api/announcements/${eventId}`, config);
  return response.data;
};

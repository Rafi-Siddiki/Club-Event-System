import axios from 'axios';

const API_URL = '/api/users/'

// Register user

const register = async (userData) => {
  const response = await axios.post(API_URL + 'reguser', userData)

  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data))
  }

  return response.data
}

// sponsor Register user
const registerSponsor = async (userData) => {
  const response = await axios.post(API_URL + 'regsponsor', userData)

  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data))
  }

  return response.data
}

// Login user
const login = async (userData) => {
  const response = await axios.post(API_URL + 'login', userData)

  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data))
  }

  return response.data
}

// Logout user
const logout = () => {
  localStorage.removeItem('user')
}

const authService = {
  register,
  logout,
  login,
  registerSponsor,
}

export default authService
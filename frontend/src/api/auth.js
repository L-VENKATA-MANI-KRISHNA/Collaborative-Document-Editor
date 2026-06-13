// Frontend auth API utilities.

import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/auth`;

/** JWT storage helpers */
export const getToken = () => localStorage.getItem('docs_token');
export const setToken = (token) => localStorage.setItem('docs_token', token);
export const removeToken = () => localStorage.removeItem('docs_token');

/** Authenticated user profile metadata helpers */
export const getUser = () => {
  const user = localStorage.getItem('docs_user');
  return user ? JSON.parse(user) : null;
};
export const setUser = (user) => localStorage.setItem('docs_user', JSON.stringify(user));
export const removeUser = () => localStorage.removeItem('docs_user');

/** Axios instance pre-configured with base API URL */
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`
});

/** Request interceptor dynamically appending Bearer JWT */
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Encapsulated auth API methods */
export const authApi = {
  /** Submits registration data and initializes local session */
  register: async (userData) => {
    const res = await axios.post(`${API_URL}/register`, userData);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  },

  /** Authenticates user credentials and establishes local session */
  login: async (credentials) => {
    const res = await axios.post(`${API_URL}/login`, credentials);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  },

  /** Clears local authentication storage */
  logout: () => {
    removeToken();
    removeUser();
  },

  /** Fetches latest profile data from protected backend endpoint */
  getProfile: async () => {
    const res = await api.get('/auth/me');
    setUser(res.data);
    return res.data;
  },

  /** Queries public user directory for collaboration invitations */
  searchUsers: async (search) => {
    const res = await axios.get(`${API_URL}/users?search=${encodeURIComponent(search)}`);
    return res.data;
  }
};


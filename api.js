// A single Axios client automatically attaches the stored JWT and handles expired sessions.
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('financeflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) localStorage.removeItem('financeflow_token');
  return Promise.reject(error);
});
export const getError = (error) => error.response?.data?.message || 'Unable to reach the server. Please try again.';
export default api;

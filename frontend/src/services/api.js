import axios from 'axios';
import { supabase } from '../contexts/AuthContext';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 120000,
});

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {
    // No session — proceed without auth header (public endpoints still work)
  }
  return config;
});

// Handle 401 → redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const checkHealth = () => api.get('/health');

export const processEmail = (emailText, threadId) =>
  api.post('/process', {
    email_text: emailText,
    thread_id: threadId,
  });

export default api;

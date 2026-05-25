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

export const processEmailStream = async (emailText, threadId, onEvent) => {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = { 'Content-Type': 'application/json' };
  
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/process`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email_text: emailText, thread_id: threadId }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = '/login';
    }
    throw new Error(`API Error: ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.substring(6).trim();
          if (dataStr) {
            try {
              const data = JSON.parse(dataStr);
              onEvent(data);
            } catch (err) {
              console.error("SSE parse error", err);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
};

export default api;

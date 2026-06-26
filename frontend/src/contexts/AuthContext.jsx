import { createContext, useContext, useEffect, useState } from 'react';

// Mock Supabase client for api.js
export const supabase = {
  auth: {
    getSession: async () => {
      const isAuth = localStorage.getItem('demo_auth');
      return { 
        data: { 
          session: isAuth ? { access_token: 'demo-token', user: { id: '1', email: 'demo@example.com' } } : null 
        } 
      };
    }
  }
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session from localStorage
    const isAuth = localStorage.getItem('demo_auth');
    if (isAuth) {
      const mockUser = { id: '1', email: 'demo@example.com', user_metadata: { full_name: 'Demo User' } };
      setUser(mockUser);
      setSession({ access_token: 'demo-token', user: mockUser });
    }
    setLoading(false);
  }, []);

  const signUp = async (email, password, fullName) => {
    const mockUser = { id: '1', email, user_metadata: { full_name: fullName } };
    setUser(mockUser);
    setSession({ access_token: 'demo-token', user: mockUser });
    localStorage.setItem('demo_auth', 'true');
    return { user: mockUser };
  };

  const signIn = async (email, password) => {
    const mockUser = { id: '1', email, user_metadata: { full_name: 'Demo User' } };
    setUser(mockUser);
    setSession({ access_token: 'demo-token', user: mockUser });
    localStorage.setItem('demo_auth', 'true');
    return { user: mockUser };
  };

  const signInWithGoogle = async () => {
    const mockUser = { id: '1', email: 'google@example.com', user_metadata: { full_name: 'Google User' } };
    setUser(mockUser);
    setSession({ access_token: 'demo-token', user: mockUser });
    localStorage.setItem('demo_auth', 'true');
    return { user: mockUser };
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem('demo_auth');
  };

  const getToken = async () => {
    return localStorage.getItem('demo_auth') ? 'demo-token' : null;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signOut, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

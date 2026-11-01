import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, clearSession, getCurrentUser, getToken, saveSession } from './api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getCurrentUser());
  const [authConfig, setAuthConfig] = useState({ authMode: 'jwt', isCognitoConfigured: false });
  const isAuthed = Boolean(user && getToken());

  useEffect(() => {
    api('/auth/config')
      .then((cfg) => setAuthConfig(cfg))
      .catch(() => {});
  }, []);

  const login = async (email, password) => {
    const { user: u, token } = await api('/auth/login', { method: 'POST', body: { email, password } });
    saveSession(u, token);
    setUser(u);
    return u;
  };

  const register = async (payload) => {
    const { user: u, token } = await api('/auth/register', { method: 'POST', body: payload });
    saveSession(u, token);
    setUser(u);
    return u;
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  // Keep the header in sync when the server returns a fresher user record.
  const syncUser = useCallback((u) => {
    if (!u) return;
    saveSession(u, getToken());
    setUser(u);
  }, []);

  const refreshUserFromServer = useCallback(async () => {
    const { user: u } = await api('/auth/me');
    syncUser(u);
    return u;
  }, [syncUser]);

  return (
    <AuthCtx.Provider value={{ user, isAuthed, authConfig, login, register, logout, syncUser, refreshUserFromServer }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}

export function homeFor(role) {
  if (role === 'RECRUITER') return '/recruiter';
  if (role === 'OFFICER') return '/officer';
  return '/student';
}

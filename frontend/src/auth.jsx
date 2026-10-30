import { createContext, useContext, useState } from 'react';
import { api, clearSession, getCurrentUser, getToken, saveSession } from './api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getCurrentUser());
  const isAuthed = Boolean(user && getToken());

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

  const refreshUserFromServer = async () => {
    if (user?.role === 'STUDENT') {
      // keeps local name in sync after profile edits
      const { profile } = await api('/profile/me');
      if (profile) return { profile };
    }
    return null;
  };

  return (
    <AuthCtx.Provider value={{ user, isAuthed, login, register, logout, refreshUserFromServer }}>
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

// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'fd_auth';
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				setUser(parsed.user || null);
				setToken(parsed.token || null);
			}
		} catch {}
		setLoading(false);
	}, []);

  const saveSession = (nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: nextUser, token: nextToken }));
  };

  const clearSession = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const signup = async ({ name, email, password, role }) => {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Signup failed');
    }
    const data = await res.json();
    saveSession(data.user, data.token);
    return data.user;
  };

  const login = async ({ email, password }) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Login failed');
    }
    const data = await res.json();
    saveSession(data.user, data.token);
    return data.user;
  };

  const googleLogin = async (credential) => {
    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Google authentication failed');
    }
    const data = await res.json();
    saveSession(data.user, data.token);
    return data.user;
  };

  const logout = () => {
    clearSession();
  };

  const hasRole = (r) => user?.role === r;

  const value = useMemo(() => ({ user, token, loading, signup, login, googleLogin, logout, hasRole, API_BASE }), [user, token, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

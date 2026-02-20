import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

/**
 * Authentication provider for the OMS.
 * In dev mode: calls /dev/token to generate test JWTs.
 * In production: integrate with your identity provider (Auth0/Firebase/Keycloak).
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('oms_token'));
  const [loading, setLoading] = useState(true);

  // On mount, restore user from stored token
  useEffect(() => {
    const storedUser = localStorage.getItem('oms_user');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = useCallback(async (name, email, role) => {
    const res = await api.post('/dev/token', { name, email, role });
    const { token: newToken, ...userData } = res.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('oms_token', newToken);
    localStorage.setItem('oms_user', JSON.stringify(userData));
    return userData;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('oms_token');
    localStorage.removeItem('oms_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;

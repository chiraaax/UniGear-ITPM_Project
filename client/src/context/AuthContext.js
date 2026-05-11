import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('unigear_token');
    const storedUser = localStorage.getItem('unigear_user');
    const storedTheme = localStorage.getItem('unigear_theme');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
    }
    setAuthReady(true);
  }, []);

  useEffect(() => {
    const body = document.body;
    if (!body) return;
    body.classList.remove('light-mode', 'dark-mode');
    body.classList.add(theme === 'light' ? 'light-mode' : 'dark-mode');
    localStorage.setItem('unigear_theme', theme);
  }, [theme]);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('unigear_token', newToken);
    localStorage.setItem('unigear_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('unigear_token');
    localStorage.removeItem('unigear_user');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, theme, toggleTheme, authReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
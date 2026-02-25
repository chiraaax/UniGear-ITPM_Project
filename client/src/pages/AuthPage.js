import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const AuthPage = () => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Authentication failed');
        return;
      }

      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="module-page-container" style={{ maxWidth: '680px' }}>
      <h1>{mode === 'login' ? 'Welcome back to UniGear' : 'Join UniGear'}</h1>
      <p className="module-description">
        Sign in with your university email to access trusted rentals and micro-tasks.
      </p>
      <div
        className="module-layout"
        style={{
          gridTemplateColumns: 'minmax(0, 1.1fr)',
        }}
      >
        <section className="module-section">
          <form className="module-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label>
                Name
                <input name="name" value={form.name} onChange={handleChange} required />
              </label>
            )}
            <label>
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </label>
            {error && <p className="muted" style={{ color: '#fca5a5' }}>{error}</p>}
            <button type="submit">{mode === 'login' ? 'Sign in' : 'Create account'}</button>
            <button
              type="button"
              onClick={() => setMode((m) => (m === 'login' ? 'register' : 'login'))}
              style={{ background: 'transparent', boxShadow: 'none', marginTop: '0.2rem' }}
            >
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AuthPage;


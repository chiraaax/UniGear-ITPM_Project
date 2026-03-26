import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/admin';

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Admin sign in failed.');
        return;
      }
      if (data?.user?.role !== 'admin') {
        setError('This account is not an admin account.');
        return;
      }
      login(data.token, data.user);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="module-page-container" style={{ maxWidth: '680px' }}>
      <h1>Admin Login</h1>
      <p className="module-description">Sign in with your admin account to access moderation and management tools.</p>
      <div className="module-layout" style={{ gridTemplateColumns: 'minmax(0, 1.1fr)' }}>
        <section className="module-section">
          <form className="module-form" onSubmit={handleSubmit}>
            <label>
              Admin Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </label>
            {error && <p className="muted" style={{ color: '#fca5a5' }}>{error}</p>}
            <button type="submit">Sign in as Admin</button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AdminLoginPage;

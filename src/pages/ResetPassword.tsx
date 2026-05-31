import { useState, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import './Register.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="register-page">
        <div className="register-card">
          <h1>Invalid Link</h1>
          <p style={{ textAlign: 'center', color: '#ef5350' }}>No reset token provided.</p>
          <button
            onClick={() => navigate('/')}
            style={{ marginTop: '1rem', padding: '0.7rem', background: '#4fc3f7', color: '#0f0f23', border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/login/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Reset failed');
      }
    } catch {
      setError('Network error');
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="register-page">
        <div className="register-card">
          <h1>Password Reset</h1>
          <p style={{ textAlign: 'center', color: '#90a4ae', lineHeight: 1.6 }}>
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{ marginTop: '1rem', padding: '0.7rem', background: '#4fc3f7', color: '#0f0f23', border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <h1>Set New Password</h1>
        <form className="register-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="reset-password">New Password</label>
            <input
              id="reset-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="reset-confirm">Confirm Password</label>
            <input
              id="reset-confirm"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <p className="toggle-auth">
          Having trouble?{' '}
          <button type="button" className="btn-link" onClick={() => navigate('/')}>
            Contact Support
          </button>
        </p>
      </div>
    </div>
  );
}

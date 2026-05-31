import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import './Register.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/login/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error');
    }

    setLoading(false);
  };

  if (sent) {
    return (
      <div className="register-page">
        <div className="register-card">
          <h1>Check Your Email</h1>
          <p style={{ textAlign: 'center', color: '#90a4ae', lineHeight: 1.6 }}>
            If an account matching those details exists, we've sent a password reset link.
            <br />
            The link expires in 1 hour.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{ marginTop: '1rem', padding: '0.7rem', background: '#4fc3f7', color: '#0f0f23', border: 'none', borderRadius: '4px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <h1>Forgot Password</h1>
        <p style={{ textAlign: 'center', color: '#90a4ae', marginBottom: '1rem', fontSize: '0.95rem' }}>
          Enter your username and email address and we'll send you a link to reset your password.
        </p>
        <form className="register-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="forgot-username">Username</label>
            <input
              id="forgot-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="forgot-email">Email</label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p className="toggle-auth">
          Remember your password?{' '}
          <button type="button" className="btn-link" onClick={() => navigate('/')}>
            Sign In
          </button>
        </p>
        <p className="toggle-auth" style={{ paddingTop: 0 }}>
          Can't remember your username?{' '}
          <button type="button" className="btn-link" onClick={() => navigate('/')}>
            Contact Support
          </button>
        </p>
      </div>
    </div>
  );
}

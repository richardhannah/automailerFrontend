import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Register.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const err = await register(username, password, email, phone || undefined);

    if (err) {
      setError(err);
    } else {
      setRegistered(true);
    }

    setLoading(false);
  };

  if (registered) {
    return (
      <div className="register-page">
        <div className="register-card">
          <h1>Check Your Email</h1>
          <p style={{ textAlign: 'center', lineHeight: 1.6 }}>
            We've sent a verification link to <strong>{email}</strong>.
            <br />
            Please click the link in the email to verify your account before signing in.
          </p>
          <button type="button" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <h1>Create an Account</h1>
        <form className="register-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="reg-username">Username</label>
            <input
              id="reg-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="reg-phone">Phone (optional)</label>
            <input
              id="reg-phone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="toggle-auth">
          Already have an account?{' '}
          <button type="button" className="btn-link" onClick={() => navigate('/')}>
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}

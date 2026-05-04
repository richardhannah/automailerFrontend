import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import './SignInModal.css';

interface Props {
  onClose: () => void;
}

export default function SignInModal({ onClose }: Props) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const err = await login(username, password);
    if (err) {
      setError(err);
    } else {
      onClose();
    }

    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="signin-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Sign In</h2>
          <button className="btn-cancel" onClick={onClose}>Close</button>
        </div>
        <form className="signin-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="signin-username">Username</label>
            <input
              id="signin-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="signin-password">Password</label>
            <input
              id="signin-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

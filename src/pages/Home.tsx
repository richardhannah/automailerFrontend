import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import './Home.css';

export default function Home() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const err = await login(username, password);
    if (err) setError(err);

    setLoading(false);
  };

  if (user) {
    return (
      <div className="home">
        <h1>Welcome, {user.username}</h1>
        <p>You are logged in as <strong>{user.role}</strong>.</p>
        {user.role === 'Admin' && (
          <div className="quick-links">
            <a href="/admin">Manage Users</a>
            <a href="/customers">Manage Customers</a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="home">
      <h1>AutoMailer</h1>
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

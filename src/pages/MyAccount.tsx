import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../config';
import './MyAccount.css';

interface AccountInfo {
  username: string;
  email: string;
  role: string;
}

interface Subscription {
  subscriptionId: number;
  packageName: string;
  price: number;
  billingPeriod: string;
  dateStarted: string;
  dateEnded: string | null;
  status: string;
}

export default function MyAccount() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [resetSending, setResetSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const headers = { Authorization: `Bearer ${user.token}` };

    Promise.all([
      fetch(`${API_URL}/api/account`, { headers }).then(r => r.ok ? r.json() : null),
      fetch(`${API_URL}/api/account/subscriptions`, { headers }).then(r => r.ok ? r.json() : []),
    ]).then(([acc, subs]) => {
      setAccount(acc);
      setSubscriptions(subs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, navigate]);

  const handleCancelSubscription = async (id: number) => {
    if (!user || !confirm('Are you sure you want to cancel this subscription?')) return;

    setCancellingId(id);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/api/account/subscriptions/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (res.ok) {
        setSubscriptions(prev =>
          prev.map(s => s.subscriptionId === id
            ? { ...s, status: 'Cancelled', dateEnded: new Date().toISOString() }
            : s
          )
        );
        setMessage({ text: 'Subscription cancelled successfully', type: 'success' });
      } else {
        const err = await res.json();
        setMessage({ text: err.error || 'Failed to cancel subscription', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Network error', type: 'error' });
    }

    setCancellingId(null);
  };

  const handleRequestPasswordReset = async () => {
    if (!user) return;

    setResetSending(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/api/account/request-password-reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (res.ok) {
        setMessage({ text: 'Password reset link has been sent to your email', type: 'success' });
      } else {
        setMessage({ text: 'Failed to send password reset email', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Network error', type: 'error' });
    }

    setResetSending(false);
  };

  if (!user) return null;

  if (loading) {
    return <div className="account-page"><div className="account-loading">Loading...</div></div>;
  }

  return (
    <div className="account-page">
      <div className="account-container">
        {message && (
          <div className={`account-message ${message.type}`}>{message.text}</div>
        )}

        <div className="account-section">
          <h2>Account Details</h2>
          {account && (
            <>
              <div className="account-info-row">
                <span className="account-info-label">Username</span>
                <span className="account-info-value">{account.username}</span>
              </div>
              <div className="account-info-row">
                <span className="account-info-label">Email</span>
                <span className="account-info-value">{account.email}</span>
              </div>
            </>
          )}
        </div>

        <div className="account-section">
          <h2>My Subscriptions</h2>
          {subscriptions.length === 0 ? (
            <p className="no-subscriptions">You have no subscriptions.</p>
          ) : (
            subscriptions.map(sub => (
              <div key={sub.subscriptionId} className="subscription-card">
                <div className="subscription-header">
                  <span className="subscription-name">{sub.packageName}</span>
                  <span className={`subscription-status ${sub.status.toLowerCase()}`}>
                    {sub.status}
                  </span>
                </div>
                <div className="subscription-details">
                  <span>&pound;{sub.price.toFixed(2)} / {sub.billingPeriod.toLowerCase()}</span>
                  <span>Started: {new Date(sub.dateStarted).toLocaleDateString()}</span>
                  {sub.dateEnded && (
                    <span>Ended: {new Date(sub.dateEnded).toLocaleDateString()}</span>
                  )}
                </div>
                {sub.status !== 'Cancelled' && (
                  <div className="subscription-actions">
                    <button
                      className="btn-cancel-sub"
                      onClick={() => handleCancelSubscription(sub.subscriptionId)}
                      disabled={cancellingId === sub.subscriptionId}
                    >
                      {cancellingId === sub.subscriptionId ? 'Cancelling...' : 'Cancel Subscription'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="account-section">
          <h2>Password</h2>
          <p style={{ color: '#90a4ae', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Click below to receive a password reset link via email.
          </p>
          <button
            className="btn-reset-password"
            onClick={handleRequestPasswordReset}
            disabled={resetSending}
          >
            {resetSending ? 'Sending...' : 'Send Password Reset Email'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../config';
import './Home.css';

interface IptvPackage {
  iptvPackageId: number;
  iptvPackageGuid: string;
  packageName: string;
  price: number;
  billingPeriod: number;
}

export default function Home() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);

    try {
      const res = await fetch(`${API_URL}/api/Enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phoneNumber: phoneNumber || undefined, message }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setError(err?.error || 'Failed to send enquiry');
      } else {
        setSent(true);
        setEmail('');
        setPhoneNumber('');
        setMessage('');
      }
    } catch {
      setError('Network error');
    }

    setSending(false);
  };

  const [packages, setPackages] = useState<IptvPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [subscribing, setSubscribing] = useState<number | null>(null);
  const [subscribedIds, setSubscribedIds] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!user) return;
    setPackagesLoading(true);
    fetch(`${API_URL}/api/iptvpackages`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => setPackages(data))
      .finally(() => setPackagesLoading(false));

  }, [user]);

  const billingLabel = (period: number) => period === 1 ? '/year' : '/month';

  const handleSubscribe = async (packageId: number) => {
    if (!user) return;
    setSubscribing(packageId);
    try {
      const res = await fetch(`${API_URL}/api/Subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ iptvPackageId: packageId }),
      });
      if (res.ok) {
        setSubscribedIds(prev => new Set(prev).add(packageId));
        showToast('Subscription request submitted!', 'success');
      } else {
        const err = await res.json().catch(() => null);
        showToast(err?.error || 'Failed to subscribe', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
    setSubscribing(null);
  };

  if (user) {
    return (
      <div className="home">
        {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
        <div className="welcome-section">
          <h1>Welcome to TellyBox, {user.username}</h1>
          <p className="tagline">Your favourite shows, all in one place.</p>
          <p className="welcome-blurb">
            Stream thousands of hit series, beloved classics and hand-picked gems.
            Whether you're revisiting old friends or discovering something new,
            TellyBox has something for every mood, every night.
          </p>
          <ul className="features">
            <li>Thousands of channels at your fingertips</li>
            <li>Entertainment, movies and live sport in one place</li>
            <li>Watch on any device, pick up right where you left off</li>
            <li>New shows and classics added every week</li>
          </ul>
          <a
            href="https://t.me/+UnW-Scvdk9ViYjU1"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-support"
          >
            Get Support
          </a>
        </div>

        <div className="packages-section">
          <h2>Choose Your Package</h2>
          {packagesLoading ? (
            <p className="loading-text">Loading packages...</p>
          ) : packages.length === 0 ? (
            <p className="loading-text">No packages available at the moment.</p>
          ) : (
            <div className="package-cards">
              {packages.map(p => (
                <div key={p.iptvPackageGuid} className="package-card">
                  <h3>{p.packageName}</h3>
                  <div className="package-price">
                    <span className="price-amount">${p.price.toFixed(2)}</span>
                    <span className="price-period">{billingLabel(p.billingPeriod)}</span>
                  </div>
                  <button
                    className="btn-subscribe"
                    disabled={subscribing === p.iptvPackageId || subscribedIds.has(p.iptvPackageId)}
                    onClick={() => handleSubscribe(p.iptvPackageId)}
                  >
                    {subscribedIds.has(p.iptvPackageId)
                      ? 'Requested'
                      : subscribing === p.iptvPackageId
                        ? 'Subscribing...'
                        : 'Subscribe'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

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
      <div className="hero-row">
        <div className="hero-blurb">
          <h1>TellyBox</h1>
          <p className="tagline">Your favourite shows, all in one place.</p>
          <p>Stream thousands of hit series, beloved classics and hand-picked gems — from timeless favourites to the latest must-watch originals. Whether you're revisiting old friends or discovering something new, TellyBox has something for every mood, every night.</p>
          <ul className="features">
            <li>Thousands of channels at your fingertips</li>
            <li>Entertainment, movies and live sport in one place</li>
            <li>Watch on any device, pick up right where you left off</li>
            <li>New shows and classics added every week</li>
          </ul>
          <a
            href="https://t.me/+UnW-Scvdk9ViYjU1"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-support"
          >
            Get Support
          </a>
        </div>
        <form className="enquiry-form" onSubmit={handleSubmit}>
          <h2 className="enquiry-title">Get in Touch</h2>
          {sent ? (
            <div className="enquiry-success">
              <p>Thanks for your enquiry! We'll be in touch soon.</p>
              <button type="button" onClick={() => setSent(false)}>Send another</button>
            </div>
          ) : (
            <>
              <div className="field">
                <label htmlFor="enquiry-email">Email *</label>
                <input
                  id="enquiry-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="enquiry-phone">Phone Number</label>
                <input
                  id="enquiry-phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="enquiry-message">Message *</label>
                <textarea
                  id="enquiry-message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              {error && <p className="error">{error}</p>}
              <button type="submit" disabled={sending}>
                {sending ? 'Sending...' : 'Send Enquiry'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

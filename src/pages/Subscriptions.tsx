import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../config';
import './Subscriptions.css';

interface SubscriptionRecord {
  subscriptionId: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  iptvPackageId: number;
  packageName: string;
  dateStarted: string;
  dateEnded: string | null;
  status: string;
}

interface CustomerOption {
  customerId: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface PackageOption {
  iptvPackageId: number;
  packageName: string;
}

interface SubForm {
  customerId: string;
  iptvPackageId: string;
  status: string;
  dateEnded: string;
}

const emptyForm: SubForm = {
  customerId: '',
  iptvPackageId: '',
  status: 'Pending',
  dateEnded: '',
};

const statusOptions = ['Pending', 'Subscribed', 'Cancelled'];

export default function Subscriptions() {
  const { user } = useAuth();
  const [subs, setSubs] = useState<SubscriptionRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<SubForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${user!.token}`,
  };

  const authHeader = { Authorization: `Bearer ${user!.token}` };

  const fetchSubs = async () => {
    const res = await fetch(`${API_URL}/api/Subscriptions`, { headers: authHeader });
    if (res.ok) setSubs(await res.json());
    setLoading(false);
  };

  const fetchCustomers = async () => {
    const res = await fetch(`${API_URL}/api/Customers`, { headers: authHeader });
    if (res.ok) setCustomers(await res.json());
  };

  const fetchPackages = async () => {
    const res = await fetch(`${API_URL}/api/IptvPackages`, { headers: authHeader });
    if (res.ok) setPackages(await res.json());
  };

  useEffect(() => {
    fetchSubs();
    fetchCustomers();
    fetchPackages();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    let res: Response;
    if (editingId) {
      res = await fetch(`${API_URL}/api/Subscriptions/${editingId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          iptvPackageId: Number(form.iptvPackageId),
          status: form.status,
          dateEnded: form.dateEnded || null,
        }),
      });
    } else {
      res = await fetch(`${API_URL}/api/Subscriptions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customerId: Number(form.customerId),
          iptvPackageId: Number(form.iptvPackageId),
          status: form.status,
        }),
      });
    }

    if (res.ok) {
      showToast(editingId ? 'Subscription updated' : 'Subscription created', 'success');
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      fetchSubs();
    } else {
      const err = await res.json().catch(() => null);
      showToast(err?.error || 'Something went wrong', 'error');
    }
  };

  const startEdit = (s: SubscriptionRecord) => {
    setForm({
      customerId: s.customerId.toString(),
      iptvPackageId: s.iptvPackageId.toString(),
      status: s.status,
      dateEnded: s.dateEnded ? s.dateEnded.split('T')[0] : '',
    });
    setEditingId(s.subscriptionId);
    setShowForm(true);
  };

  const deleteSub = async (id: number) => {
    if (!confirm('Delete this subscription?')) return;
    const res = await fetch(`${API_URL}/api/Subscriptions/${id}`, {
      method: 'DELETE',
      headers: authHeader,
    });
    if (res.ok) {
      showToast('Subscription deleted', 'success');
      fetchSubs();
    } else {
      showToast('Failed to delete', 'error');
    }
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString();
  };

  if (!user || user.role !== 'Admin') {
    return <div className="subscriptions"><h1>Access Denied</h1><p>Admin role required.</p></div>;
  }

  if (loading) return <div className="subscriptions"><p>Loading...</p></div>;

  return (
    <div className="subscriptions">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
      <div className="subscriptions-header">
        <h1>Subscriptions</h1>
        {!showForm && (
          <button className="btn-add" onClick={() => setShowForm(true)}>
            + Add Subscription
          </button>
        )}
      </div>

      {showForm && (
        <form className="sub-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit Subscription' : 'New Subscription'}</h2>
          <div className="form-grid">
            <div className="field">
              <label>Customer</label>
              <select
                value={form.customerId}
                onChange={e => setForm({ ...form, customerId: e.target.value })}
                required
                disabled={!!editingId}
              >
                <option value="">Select customer...</option>
                {customers.map(c => (
                  <option key={c.customerId} value={c.customerId}>
                    {c.firstName} {c.lastName} ({c.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Package</label>
              <select
                value={form.iptvPackageId}
                onChange={e => setForm({ ...form, iptvPackageId: e.target.value })}
                required
              >
                <option value="">Select package...</option>
                {packages.map(p => (
                  <option key={p.iptvPackageId} value={p.iptvPackageId}>
                    {p.packageName}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                {statusOptions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {editingId && (
              <div className="field">
                <label>Date Ended</label>
                <input
                  type="date"
                  value={form.dateEnded}
                  onChange={e => setForm({ ...form, dateEnded: e.target.value })}
                />
              </div>
            )}
          </div>
          <div className="form-actions">
            <button type="submit">{editingId ? 'Update' : 'Create'}</button>
            <button type="button" className="btn-cancel" onClick={cancelForm}>Cancel</button>
          </div>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Package</th>
            <th>Status</th>
            <th>Started</th>
            <th>Ended</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subs.map(s => (
            <tr key={s.subscriptionId}>
              <td>
                <div>{s.customerName}</div>
                <div className="sub-email">{s.customerEmail}</div>
              </td>
              <td>{s.packageName}</td>
              <td><span className={`status-badge status-${s.status.toLowerCase()}`}>{s.status}</span></td>
              <td>{formatDate(s.dateStarted)}</td>
              <td>{formatDate(s.dateEnded)}</td>
              <td className="actions">
                <button className="btn-edit" onClick={() => startEdit(s)}>Edit</button>
                <button className="btn-delete" onClick={() => deleteSub(s.subscriptionId)}>Delete</button>
              </td>
            </tr>
          ))}
          {subs.length === 0 && (
            <tr><td colSpan={6} className="empty">No subscriptions yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

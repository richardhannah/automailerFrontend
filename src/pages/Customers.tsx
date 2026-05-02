import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../config';
import './Customers.css';

interface Customer {
  customerId: number;
  customerGuid: string;
  firstName: string;
  lastName: string;
  email: string;
  userCode: string;
  expirationDate: string | null;
  followUp: boolean;
}

interface CustomerForm {
  firstName: string;
  lastName: string;
  email: string;
  userCode: string;
  expirationDate: string;
  followUp: boolean;
}

const emptyForm: CustomerForm = {
  firstName: '',
  lastName: '',
  email: '',
  userCode: '',
  expirationDate: '',
  followUp: false,
};

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
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

  const fetchCustomers = async () => {
    const res = await fetch(`${API_URL}/api/customers`, {
      headers: { Authorization: `Bearer ${user!.token}` },
    });
    if (res.ok) setCustomers(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      expirationDate: form.expirationDate || null,
    };

    if (editingId) {
      await fetch(`${API_URL}/api/customers/${editingId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(`${API_URL}/api/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    }

    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    fetchCustomers();
  };

  const startEdit = (c: Customer) => {
    setForm({
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      userCode: c.userCode,
      expirationDate: c.expirationDate || '',
      followUp: c.followUp,
    });
    setEditingId(c.customerId);
    setShowForm(true);
  };

  const deleteCustomer = async (id: number) => {
    if (!confirm('Delete this customer?')) return;
    await fetch(`${API_URL}/api/customers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user!.token}` },
    });
    fetchCustomers();
  };

  const sendEmail = async (c: Customer) => {
    const res = await fetch(`${API_URL}/api/email/send`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: c.email,
        toName: `${c.firstName} ${c.lastName}`,
        subject: 'Hello from AutoMailer',
        body: `Hi ${c.firstName}, this is a test email from AutoMailer. Your user code is ${c.userCode}.`,
      }),
    });
    if (res.ok) {
      showToast(`Email sent to ${c.email}`, 'success');
    } else {
      showToast('Failed to send email', 'error');
    }
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  if (!user || user.role !== 'Admin') {
    return <div className="customers"><h1>Access Denied</h1><p>Admin role required.</p></div>;
  }

  if (loading) return <div className="customers"><p>Loading...</p></div>;

  return (
    <div className="customers">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
      <div className="customers-header">
        <h1>Customers</h1>
        {!showForm && (
          <button className="btn-add" onClick={() => setShowForm(true)}>
            + Add Customer
          </button>
        )}
      </div>

      {showForm && (
        <form className="customer-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit Customer' : 'New Customer'}</h2>
          <div className="form-grid">
            <div className="field">
              <label>First Name</label>
              <input
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Last Name</label>
              <input
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>User Code</label>
              <input
                value={form.userCode}
                onChange={e => setForm({ ...form, userCode: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Expiration Date</label>
              <input
                type="date"
                value={form.expirationDate}
                onChange={e => setForm({ ...form, expirationDate: e.target.value })}
              />
            </div>
            <div className="field checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={form.followUp}
                  onChange={e => setForm({ ...form, followUp: e.target.checked })}
                />
                Follow Up
              </label>
            </div>
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
            <th>Name</th>
            <th>Email</th>
            <th>Code</th>
            <th>Expires</th>
            <th>Follow Up</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.customerId}>
              <td>{c.firstName} {c.lastName}</td>
              <td>{c.email}</td>
              <td>{c.userCode}</td>
              <td>{c.expirationDate || '—'}</td>
              <td>{c.followUp ? 'Yes' : 'No'}</td>
              <td className="actions">
                <button className="btn-edit" onClick={() => startEdit(c)}>Edit</button>
                <button className="btn-email" onClick={() => sendEmail(c)}>Send Email</button>
                <button className="btn-delete" onClick={() => deleteCustomer(c.customerId)}>Delete</button>
              </td>
            </tr>
          ))}
          {customers.length === 0 && (
            <tr><td colSpan={6} className="empty">No customers yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

import { Fragment, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../config';
import { type Customer } from '../templateUtils';
import SendEmailModal from './SendEmailModal';
import './Customers.css';

interface CustomerForm {
  firstName: string;
  lastName: string;
  email: string;
  iptvUser: string;
  iptvPassword: string;
  notes: string;
  expirationDate: string;
  followUp: boolean;
}

interface CustomerSub {
  subscriptionId: number;
  customerId: number;
  iptvPackageId: number;
  packageName: string;
  dateStarted: string;
  dateEnded: string | null;
  status: string;
}

interface PackageOption {
  iptvPackageId: number;
  packageName: string;
}

interface SubEditForm {
  iptvPackageId: string;
  status: string;
  dateEnded: string;
}

const emptyForm: CustomerForm = {
  firstName: '',
  lastName: '',
  email: '',
  iptvUser: '',
  iptvPassword: '',
  notes: '',
  expirationDate: '',
  followUp: false,
};

const statusOptions = ['Pending', 'Subscribed', 'Cancelled'];

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [emailCustomer, setEmailCustomer] = useState<Customer | null>(null);

  const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(null);
  const [customerSubs, setCustomerSubs] = useState<CustomerSub[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [editingSubId, setEditingSubId] = useState<number | null>(null);
  const [subForm, setSubForm] = useState<SubEditForm>({ iptvPackageId: '', status: 'Pending', dateEnded: '' });
  const [showNewSub, setShowNewSub] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${user!.token}`,
  };

  const authHeader = { Authorization: `Bearer ${user!.token}` };

  const fetchCustomers = async () => {
    const res = await fetch(`${API_URL}/api/customers`, { headers: authHeader });
    if (res.ok) setCustomers(await res.json());
    setLoading(false);
  };

  const fetchPackages = async () => {
    const res = await fetch(`${API_URL}/api/IptvPackages`, { headers: authHeader });
    if (res.ok) setPackages(await res.json());
  };

  useEffect(() => {
    fetchCustomers();
    fetchPackages();
  }, []);

  const fetchCustomerSubs = async (customerId: number) => {
    setSubsLoading(true);
    const res = await fetch(`${API_URL}/api/Subscriptions/customer/${customerId}`, { headers: authHeader });
    if (res.ok) setCustomerSubs(await res.json());
    setSubsLoading(false);
  };

  const toggleExpand = (customerId: number) => {
    if (expandedCustomerId === customerId) {
      setExpandedCustomerId(null);
      setCustomerSubs([]);
      setEditingSubId(null);
      setShowNewSub(false);
    } else {
      setExpandedCustomerId(customerId);
      setEditingSubId(null);
      setShowNewSub(false);
      fetchCustomerSubs(customerId);
    }
  };

  const startEditSub = (s: CustomerSub) => {
    setSubForm({
      iptvPackageId: s.iptvPackageId.toString(),
      status: s.status,
      dateEnded: s.dateEnded ? s.dateEnded.split('T')[0] : '',
    });
    setEditingSubId(s.subscriptionId);
    setShowNewSub(false);
  };

  const startNewSub = () => {
    setSubForm({ iptvPackageId: '', status: 'Pending', dateEnded: '' });
    setEditingSubId(null);
    setShowNewSub(true);
  };

  const cancelSubEdit = () => {
    setEditingSubId(null);
    setShowNewSub(false);
  };

  const saveSubEdit = async () => {
    if (!editingSubId) return;
    const res = await fetch(`${API_URL}/api/Subscriptions/${editingSubId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        iptvPackageId: Number(subForm.iptvPackageId),
        status: subForm.status,
        dateEnded: subForm.dateEnded || null,
      }),
    });
    if (res.ok) {
      showToast('Subscription updated', 'success');
      setEditingSubId(null);
      fetchCustomerSubs(expandedCustomerId!);
    } else {
      const err = await res.json().catch(() => null);
      showToast(err?.error || 'Failed to update', 'error');
    }
  };

  const createSub = async () => {
    if (!expandedCustomerId || !subForm.iptvPackageId) return;
    const res = await fetch(`${API_URL}/api/Subscriptions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customerId: expandedCustomerId,
        iptvPackageId: Number(subForm.iptvPackageId),
        status: subForm.status,
      }),
    });
    if (res.ok) {
      showToast('Subscription created', 'success');
      setShowNewSub(false);
      fetchCustomerSubs(expandedCustomerId);
    } else {
      const err = await res.json().catch(() => null);
      showToast(err?.error || 'Failed to create', 'error');
    }
  };

  const deleteSub = async (id: number) => {
    if (!confirm('Delete this subscription?')) return;
    const res = await fetch(`${API_URL}/api/Subscriptions/${id}`, {
      method: 'DELETE',
      headers: authHeader,
    });
    if (res.ok) {
      showToast('Subscription deleted', 'success');
      fetchCustomerSubs(expandedCustomerId!);
    } else {
      showToast('Failed to delete', 'error');
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString();
  };

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
      iptvUser: c.iptvUser,
      iptvPassword: c.iptvPassword || '',
      notes: c.notes || '',
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
      headers: authHeader,
    });
    fetchCustomers();
  };

  const openEmailModal = (c: Customer) => {
    setEmailCustomer(c);
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
              <label>IPTV User</label>
              <input
                value={form.iptvUser}
                onChange={e => setForm({ ...form, iptvUser: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>IPTV Password</label>
              <input
                value={form.iptvPassword}
                onChange={e => setForm({ ...form, iptvPassword: e.target.value })}
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
            <div className="field">
              <label>Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={3}
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
            <th>IPTV User</th>
            <th>IPTV Password</th>
            <th>Expires</th>
            <th>Notes</th>
            <th>Follow Up</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <Fragment key={c.customerId}>
              <tr
                className={`customer-row${expandedCustomerId === c.customerId ? ' expanded' : ''}`}
                onClick={() => toggleExpand(c.customerId)}
              >
                <td>{c.firstName} {c.lastName}</td>
                <td>{c.email}</td>
                <td>{c.iptvUser}</td>
                <td>{c.iptvPassword || '—'}</td>
                <td>{c.expirationDate || '—'}</td>
                <td>{c.notes || '—'}</td>
                <td>{c.followUp ? 'Yes' : 'No'}</td>
                <td className="actions" onClick={e => e.stopPropagation()}>
                  <button className="btn-edit" onClick={() => startEdit(c)}>Edit</button>
                  <button className="btn-email" onClick={() => openEmailModal(c)}>Send Email</button>
                  <button className="btn-delete" onClick={() => deleteCustomer(c.customerId)}>Delete</button>
                </td>
              </tr>
              {expandedCustomerId === c.customerId && (
                <tr key={`sub-${c.customerId}`} className="sub-detail-row">
                  <td colSpan={8}>
                    <div className="sub-panel">
                      <div className="sub-panel-header">
                        <h3>Subscriptions</h3>
                        {!showNewSub && !editingSubId && (
                          <button className="btn-add-small" onClick={startNewSub}>+ Add</button>
                        )}
                      </div>

                      {subsLoading ? (
                        <p className="sub-loading">Loading subscriptions...</p>
                      ) : (
                        <>
                          {(showNewSub || editingSubId) && (
                            <div className="sub-edit-row">
                              <select
                                value={subForm.iptvPackageId}
                                onChange={e => setSubForm({ ...subForm, iptvPackageId: e.target.value })}
                                required
                              >
                                <option value="">Package...</option>
                                {packages.map(p => (
                                  <option key={p.iptvPackageId} value={p.iptvPackageId}>{p.packageName}</option>
                                ))}
                              </select>
                              <select
                                value={subForm.status}
                                onChange={e => setSubForm({ ...subForm, status: e.target.value })}
                              >
                                {statusOptions.map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              {editingSubId && (
                                <input
                                  type="date"
                                  value={subForm.dateEnded}
                                  onChange={e => setSubForm({ ...subForm, dateEnded: e.target.value })}
                                  placeholder="End date"
                                />
                              )}
                              <button className="btn-save-sub" onClick={editingSubId ? saveSubEdit : createSub}>
                                {editingSubId ? 'Save' : 'Create'}
                              </button>
                              <button className="btn-cancel-small" onClick={cancelSubEdit}>Cancel</button>
                            </div>
                          )}

                          {customerSubs.length === 0 && !showNewSub ? (
                            <p className="sub-empty">No subscriptions for this customer.</p>
                          ) : (
                            <table className="sub-table">
                              <thead>
                                <tr>
                                  <th>Package</th>
                                  <th>Status</th>
                                  <th>Started</th>
                                  <th>Ended</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {customerSubs.map(s => (
                                  <tr key={s.subscriptionId} className={editingSubId === s.subscriptionId ? 'editing' : ''}>
                                    <td>{s.packageName}</td>
                                    <td><span className={`status-badge status-${s.status.toLowerCase()}`}>{s.status}</span></td>
                                    <td>{formatDate(s.dateStarted)}</td>
                                    <td>{formatDate(s.dateEnded)}</td>
                                    <td className="actions">
                                      <button className="btn-edit" onClick={() => startEditSub(s)}>Edit</button>
                                      <button className="btn-delete" onClick={() => deleteSub(s.subscriptionId)}>Delete</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
          {customers.length === 0 && (
            <tr><td colSpan={8} className="empty">No customers yet.</td></tr>
          )}
        </tbody>
      </table>

      {emailCustomer && (
        <SendEmailModal
          customer={emailCustomer}
          onClose={() => setEmailCustomer(null)}
          onSent={() => {
            showToast(`Email sent to ${emailCustomer.email}`, 'success');
            setEmailCustomer(null);
          }}
        />
      )}
    </div>
  );
}

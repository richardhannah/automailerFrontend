import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../config';
import { type EmailTemplate } from '../templateUtils';
import './ReportingSettings.css';

interface AdminUser {
  userId: string;
  username: string;
  role: string;
  email: string;
}

interface WorkflowEmailSetting {
  workflowEmailSettingId: number;
  workflowType: string;
  recipientType: string;
  emailTemplateId: number | null;
  emailTemplateName: string | null;
}

interface ReportSetting {
  reportingSettingId: number;
  name: string;
  emailAddress: string;
  emailTemplateId: number | null;
}

interface ReportSettingForm {
  name: string;
  emailAddress: string;
  emailTemplateId: number | null;
}

const emptyForm: ReportSettingForm = {
  name: '',
  emailAddress: '',
  emailTemplateId: null,
};

export default function ReportingSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ReportSetting[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  const [enquiryCustomerTemplateId, setEnquiryCustomerTemplateId] = useState<number | null>(null);
  const [enquiryAdminTemplateId, setEnquiryAdminTemplateId] = useState<number | null>(null);
  const [workflowSaving, setWorkflowSaving] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [enquiryRecipientIds, setEnquiryRecipientIds] = useState<Set<string>>(new Set());
  const [recipientSearch, setRecipientSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const recipientInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ReportSettingForm>(emptyForm);
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

  const fetchSettings = async () => {
    const res = await fetch(`${API_URL}/api/ReportSettings`, {
      headers: { Authorization: `Bearer ${user!.token}` },
    });
    if (res.ok) setSettings(await res.json());
    setLoading(false);
  };

  const fetchTemplates = async () => {
    const res = await fetch(`${API_URL}/api/EmailTemplates`, {
      headers: { Authorization: `Bearer ${user!.token}` },
    });
    if (res.ok) setTemplates(await res.json());
  };

  const fetchWorkflowSettings = async () => {
    const res = await fetch(`${API_URL}/api/WorkflowEmailSettings/Enquiry`, {
      headers: { Authorization: `Bearer ${user!.token}` },
    });
    if (res.ok) {
      const data: WorkflowEmailSetting[] = await res.json();
      const customer = data.find(s => s.recipientType === 'Customer');
      const admin = data.find(s => s.recipientType === 'Admin');
      setEnquiryCustomerTemplateId(customer?.emailTemplateId ?? null);
      setEnquiryAdminTemplateId(admin?.emailTemplateId ?? null);
    }
  };

  const saveWorkflowSetting = async (recipientType: string, emailTemplateId: number | null) => {
    setWorkflowSaving(true);
    const res = await fetch(`${API_URL}/api/WorkflowEmailSettings/Enquiry/${recipientType}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ emailTemplateId }),
    });
    setWorkflowSaving(false);
    if (res.ok) {
      showToast('Workflow email setting saved', 'success');
    } else {
      showToast('Failed to save workflow setting', 'error');
    }
  };

  const fetchAdminUsers = async () => {
    const res = await fetch(`${API_URL}/api/Users`, {
      headers: { Authorization: `Bearer ${user!.token}` },
    });
    if (res.ok) {
      const users: AdminUser[] = await res.json();
      setAdminUsers(users.filter(u => u.role === 'Admin'));
    }
  };

  const fetchEnquiryRecipients = async () => {
    const res = await fetch(`${API_URL}/api/WorkflowEmailSettings/Enquiry/recipients`, {
      headers: { Authorization: `Bearer ${user!.token}` },
    });
    if (res.ok) {
      const ids: string[] = await res.json();
      setEnquiryRecipientIds(new Set(ids));
    }
  };

  const addRecipient = async (userId: string) => {
    const res = await fetch(`${API_URL}/api/WorkflowEmailSettings/Enquiry/recipients/${userId}`, {
      method: 'PUT',
      headers,
    });
    if (res.ok) {
      setEnquiryRecipientIds(prev => new Set(prev).add(userId));
      setRecipientSearch('');
      setShowSuggestions(false);
      showToast('Recipient added', 'success');
    } else {
      showToast('Failed to add recipient', 'error');
    }
  };

  const removeRecipient = async (userId: string) => {
    const res = await fetch(`${API_URL}/api/WorkflowEmailSettings/Enquiry/recipients/${userId}`, {
      method: 'DELETE',
      headers,
    });
    if (res.ok) {
      setEnquiryRecipientIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      showToast('Recipient removed', 'success');
    } else {
      showToast('Failed to remove recipient', 'error');
    }
  };

  const recipientSuggestions = adminUsers.filter(
    u => !enquiryRecipientIds.has(u.userId) &&
         u.username.toLowerCase().includes(recipientSearch.toLowerCase())
  );

  const handleRecipientKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (recipientSuggestions.length > 0) {
        addRecipient(recipientSuggestions[selectedSuggestion]?.userId ?? recipientSuggestions[0].userId);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestion(prev => Math.min(prev + 1, recipientSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestion(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchTemplates();
    fetchWorkflowSettings();
    fetchAdminUsers();
    fetchEnquiryRecipients();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      emailAddress: form.emailAddress,
      emailTemplateId: form.emailTemplateId || null,
    };

    let res: Response;
    if (editingId) {
      res = await fetch(`${API_URL}/api/ReportSettings/${editingId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch(`${API_URL}/api/ReportSettings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    }

    if (res.ok) {
      showToast(editingId ? 'Recipient updated' : 'Recipient added', 'success');
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      fetchSettings();
    } else {
      showToast('Something went wrong', 'error');
    }
  };

  const startEdit = (s: ReportSetting) => {
    setForm({
      name: s.name,
      emailAddress: s.emailAddress,
      emailTemplateId: s.emailTemplateId,
    });
    setEditingId(s.reportingSettingId);
    setShowForm(true);
  };

  const deleteSetting = async (id: number) => {
    if (!confirm('Delete this recipient?')) return;
    const res = await fetch(`${API_URL}/api/ReportSettings/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user!.token}` },
    });
    if (res.ok) {
      showToast('Recipient deleted', 'success');
      fetchSettings();
    } else {
      showToast('Failed to delete', 'error');
    }
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  if (!user || user.role !== 'Admin') {
    return <div className="settings-page"><h1>Access Denied</h1><p>Admin role required.</p></div>;
  }

  if (loading) return <div className="settings-page"><p>Loading...</p></div>;

  return (
    <div className="settings-page">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
      <h1 className="settings-title">Settings</h1>

      <section className="settings-section">
        <div className="reporting-header">
          <h2>Reporting</h2>
          {!showForm && (
            <button className="btn-add" onClick={() => setShowForm(true)}>
              + Add Recipient
            </button>
          )}
        </div>

        {showForm && (
          <form className="reporting-form" onSubmit={handleSubmit}>
            <h3>{editingId ? 'Edit Recipient' : 'New Recipient'}</h3>
            <div className="form-grid">
              <div className="field">
                <label>Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={form.emailAddress}
                  onChange={e => setForm({ ...form, emailAddress: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Email Template (optional)</label>
                <select
                  value={form.emailTemplateId ?? ''}
                  onChange={e => setForm({ ...form, emailTemplateId: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">None</option>
                  {templates.map(t => (
                    <option key={t.emailTemplateId} value={t.emailTemplateId}>{t.templateName}</option>
                  ))}
                </select>
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
              <th>Email Address</th>
              <th>Template</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {settings.map(s => (
              <tr key={s.reportingSettingId}>
                <td>{s.name}</td>
                <td>{s.emailAddress}</td>
                <td>{templates.find(t => t.emailTemplateId === s.emailTemplateId)?.templateName || '—'}</td>
                <td className="actions">
                  <button className="btn-edit" onClick={() => startEdit(s)}>Edit</button>
                  <button className="btn-delete" onClick={() => deleteSetting(s.reportingSettingId)}>Delete</button>
                </td>
              </tr>
            ))}
            {settings.length === 0 && (
              <tr><td colSpan={4} className="empty">No report recipients yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="settings-section">
        <div className="section-header">
          <h2>Email Workflows</h2>
        </div>
        <p className="section-description">Configure which email templates are used when specific workflows are triggered.</p>

        <div className="workflow-group">
          <h3>Enquiry</h3>
          <p className="workflow-description">When a customer submits an enquiry, two emails are sent automatically.</p>
          <div className="workflow-fields">
            <div className="workflow-field">
              <label>Customer Confirmation Template</label>
              <select
                value={enquiryCustomerTemplateId ?? ''}
                onChange={e => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setEnquiryCustomerTemplateId(val);
                  saveWorkflowSetting('Customer', val);
                }}
                disabled={workflowSaving}
              >
                <option value="">None</option>
                {templates.map(t => (
                  <option key={t.emailTemplateId} value={t.emailTemplateId}>{t.templateName}</option>
                ))}
              </select>
            </div>
            <div className="workflow-field">
              <label>Admin Notification Template</label>
              <select
                value={enquiryAdminTemplateId ?? ''}
                onChange={e => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setEnquiryAdminTemplateId(val);
                  saveWorkflowSetting('Admin', val);
                }}
                disabled={workflowSaving}
              >
                <option value="">None</option>
                {templates.map(t => (
                  <option key={t.emailTemplateId} value={t.emailTemplateId}>{t.templateName}</option>
                ))}
              </select>
            </div>
            <div className="workflow-field">
              <label>Admin Notification Recipients</label>
              <div className="chip-input-container">
                <div className="chip-list">
                  {adminUsers
                    .filter(u => enquiryRecipientIds.has(u.userId))
                    .map(u => (
                      <span key={u.userId} className="chip">
                        {u.username}
                        <button
                          type="button"
                          className="chip-remove"
                          onClick={() => removeRecipient(u.userId)}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                </div>
                <div className="autocomplete-wrapper">
                  <input
                    ref={recipientInputRef}
                    type="text"
                    className="chip-input"
                    placeholder="Type admin name..."
                    value={recipientSearch}
                    onChange={e => {
                      setRecipientSearch(e.target.value);
                      setShowSuggestions(true);
                      setSelectedSuggestion(0);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    onKeyDown={handleRecipientKeyDown}
                  />
                  {showSuggestions && recipientSearch && recipientSuggestions.length > 0 && (
                    <ul className="autocomplete-dropdown">
                      {recipientSuggestions.map((u, i) => (
                        <li
                          key={u.userId}
                          className={`autocomplete-option${i === selectedSuggestion ? ' selected' : ''}`}
                          onMouseDown={() => addRecipient(u.userId)}
                        >
                          {u.username}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

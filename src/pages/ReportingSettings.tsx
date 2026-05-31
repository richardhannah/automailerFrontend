import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { API_URL } from '../config';
import { type EmailTemplate } from '../templateUtils';
import './ReportingSettings.css';

const SOCIAL_PLATFORMS = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourprofile' },
  { key: 'twitter', label: 'X (Twitter)', placeholder: 'https://x.com/yourhandle' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/1234567890' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourprofile' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourcompany' },
  { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/yourchannel' },
  { key: 'snapchat', label: 'Snapchat', placeholder: 'https://snapchat.com/add/yourname' },
  { key: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/yourprofile' },
  { key: 'discord', label: 'Discord', placeholder: 'https://discord.gg/yourinvite' },
  { key: 'threads', label: 'Threads', placeholder: 'https://threads.net/@yourprofile' },
  { key: 'reddit', label: 'Reddit', placeholder: 'https://reddit.com/r/yourcommunity' },
];

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
  const [subscriptionCustomerTemplateId, setSubscriptionCustomerTemplateId] = useState<number | null>(null);
  const [registrationUserTemplateId, setRegistrationUserTemplateId] = useState<number | null>(null);
  const [passwordResetUserTemplateId, setPasswordResetUserTemplateId] = useState<number | null>(null);
  const [workflowSaving, setWorkflowSaving] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [enquiryRecipientIds, setEnquiryRecipientIds] = useState<Set<string>>(new Set());
  const [recipientSearch, setRecipientSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const recipientInputRef = useRef<HTMLInputElement>(null);

  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [socialSaving, setSocialSaving] = useState(false);

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
    const [enquiryRes, subRes, regRes, resetRes] = await Promise.all([
      fetch(`${API_URL}/api/WorkflowEmailSettings/Enquiry`, { headers: { Authorization: `Bearer ${user!.token}` } }),
      fetch(`${API_URL}/api/WorkflowEmailSettings/Subscription`, { headers: { Authorization: `Bearer ${user!.token}` } }),
      fetch(`${API_URL}/api/WorkflowEmailSettings/Registration`, { headers: { Authorization: `Bearer ${user!.token}` } }),
      fetch(`${API_URL}/api/WorkflowEmailSettings/PasswordReset`, { headers: { Authorization: `Bearer ${user!.token}` } }),
    ]);
    if (enquiryRes.ok) {
      const data: WorkflowEmailSetting[] = await enquiryRes.json();
      const customer = data.find(s => s.recipientType === 'Customer');
      const admin = data.find(s => s.recipientType === 'Admin');
      setEnquiryCustomerTemplateId(customer?.emailTemplateId ?? null);
      setEnquiryAdminTemplateId(admin?.emailTemplateId ?? null);
    }
    if (subRes.ok) {
      const data: WorkflowEmailSetting[] = await subRes.json();
      const customer = data.find(s => s.recipientType === 'Customer');
      setSubscriptionCustomerTemplateId(customer?.emailTemplateId ?? null);
    }
    if (regRes.ok) {
      const data: WorkflowEmailSetting[] = await regRes.json();
      const userSetting = data.find(s => s.recipientType === 'User');
      setRegistrationUserTemplateId(userSetting?.emailTemplateId ?? null);
    }
    if (resetRes.ok) {
      const data: WorkflowEmailSetting[] = await resetRes.json();
      const userSetting = data.find(s => s.recipientType === 'User');
      setPasswordResetUserTemplateId(userSetting?.emailTemplateId ?? null);
    }
  };

  const saveWorkflowSetting = async (workflowType: string, recipientType: string, emailTemplateId: number | null) => {
    setWorkflowSaving(true);
    const res = await fetch(`${API_URL}/api/WorkflowEmailSettings/${workflowType}/${recipientType}`, {
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

  const fetchSocialLinks = async () => {
    const res = await fetch(`${API_URL}/api/SocialMediaLinks`, {
      headers: { Authorization: `Bearer ${user!.token}` },
    });
    if (res.ok) {
      const data: { platform: string; url: string }[] = await res.json();
      const map: Record<string, string> = {};
      data.forEach(l => { map[l.platform] = l.url; });
      setSocialLinks(map);
    }
  };

  const saveSocialLinks = async () => {
    setSocialSaving(true);
    const payload = SOCIAL_PLATFORMS.map(p => ({
      platform: p.key,
      url: socialLinks[p.key] || '',
    }));
    const res = await fetch(`${API_URL}/api/SocialMediaLinks`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    setSocialSaving(false);
    if (res.ok) {
      showToast('Social media links saved', 'success');
    } else {
      showToast('Failed to save social media links', 'error');
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchTemplates();
    fetchWorkflowSettings();
    fetchAdminUsers();
    fetchEnquiryRecipients();
    fetchSocialLinks();
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
                  saveWorkflowSetting('Enquiry', 'Customer', val);
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
                  saveWorkflowSetting('Enquiry', 'Admin', val);
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

        <div className="workflow-group" style={{ marginTop: '1.5rem' }}>
          <h3>Subscription</h3>
          <p className="workflow-description">When a customer subscribes to a package, a confirmation email is sent.</p>
          <div className="workflow-fields">
            <div className="workflow-field">
              <label>Customer Confirmation Template</label>
              <select
                value={subscriptionCustomerTemplateId ?? ''}
                onChange={e => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setSubscriptionCustomerTemplateId(val);
                  saveWorkflowSetting('Subscription', 'Customer', val);
                }}
                disabled={workflowSaving}
              >
                <option value="">None</option>
                {templates.map(t => (
                  <option key={t.emailTemplateId} value={t.emailTemplateId}>{t.templateName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="workflow-group" style={{ marginTop: '1.5rem' }}>
          <h3>Registration</h3>
          <p className="workflow-description">When a new user registers, a verification email is sent. Available template variables: {'{{ user.username }}'}, {'{{ user.email }}'}, {'{{ verificationLink }}'}.</p>
          <div className="workflow-fields">
            <div className="workflow-field">
              <label>Email Verification Template</label>
              <select
                value={registrationUserTemplateId ?? ''}
                onChange={e => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setRegistrationUserTemplateId(val);
                  saveWorkflowSetting('Registration', 'User', val);
                }}
                disabled={workflowSaving}
              >
                <option value="">None (plain text fallback)</option>
                {templates.map(t => (
                  <option key={t.emailTemplateId} value={t.emailTemplateId}>{t.templateName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="workflow-group" style={{ marginTop: '1.5rem' }}>
          <h3>Password Reset</h3>
          <p className="workflow-description">When a user requests a password reset, a one-time link is emailed. Available template variables: {'{{ user.username }}'}, {'{{ user.email }}'}, {'{{ resetLink }}'}.</p>
          <div className="workflow-fields">
            <div className="workflow-field">
              <label>Password Reset Template</label>
              <select
                value={passwordResetUserTemplateId ?? ''}
                onChange={e => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setPasswordResetUserTemplateId(val);
                  saveWorkflowSetting('PasswordReset', 'User', val);
                }}
                disabled={workflowSaving}
              >
                <option value="">None (plain text fallback)</option>
                {templates.map(t => (
                  <option key={t.emailTemplateId} value={t.emailTemplateId}>{t.templateName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <div className="section-header">
          <h2>Social Media Links</h2>
        </div>
        <p className="section-description">Add your social media profile URLs. Configured links will appear as icons in the page footer.</p>

        <div className="social-links-grid">
          {SOCIAL_PLATFORMS.map(p => (
            <div key={p.key} className="social-link-field">
              <label>{p.label}</label>
              <input
                type="url"
                placeholder={p.placeholder}
                value={socialLinks[p.key] || ''}
                onChange={e => setSocialLinks({ ...socialLinks, [p.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div className="form-actions" style={{ marginTop: '1rem' }}>
          <button onClick={saveSocialLinks} disabled={socialSaving}>
            {socialSaving ? 'Saving...' : 'Save Social Links'}
          </button>
        </div>
      </section>
    </div>
  );
}
